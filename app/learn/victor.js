/*
 * Copyright (C) 2026 Khodok
 *
 * This file is part of Connect4 Game Solver.
 *
 * Connect4 Game Solver is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * Connect4 Game Solver is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Connect4 Game Solver. If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * VICTOR combination solver — Tier C, Phase 1. See docs/tier-c-victor.md.
 *
 * Given a position, tries to prove the even controller (player 2) can at least
 * draw: find a CONSISTENT set of rule applications (claimeven / baseinverse /
 * aftereven) whose solved threats cover every one of the opponent's threats.
 *
 * Consistency model (Phase 1): two applications conflict iff they use any square
 * in common (disjoint-squares). This is a *sound subset* of Allis's full
 * consistency — any disjoint-squares solution is Allis-consistent — so a found
 * cover is a genuine proof. It may reject some valid combinations (lower
 * coverage); the exact pairwise rules and the remaining Allis rules are Phase 2.
 */

import {GROUPS, landingRow, COLS} from './threats.js';
import {CLAIMEVEN_PAIRS, controlledEvenSquares} from './claimeven.js';
import {afterevenGroups, threatsSolvedByAftereven} from './aftereven.js';

const sq = (r, c) => `${r}-${c}`;
const groupKey = cells => cells.map(([r, c]) => `${r},${c}`).sort().join(';');

/** Opponent threats: every group the controller has no disc in (still winnable by the opponent). */
export function enumerateThreats(board, controller = 2) {
  const threats = [];
  for (let id = 0; id < GROUPS.length; id++) {
    const cells = GROUPS[id];
    if (cells.some(([r, c]) => board[r][c] === controller)) continue;
    threats.push({id, cells, keys: new Set(cells.map(([r, c]) => sq(r, c))), key: groupKey(cells)});
  }
  return threats;
}

/**
 * Every available rule application, each tagged with the threat ids it solves
 * and the squares it uses.
 */
export function enumerateRuleApps(board, threats, controller = 2) {
  const apps = [];

  // ── Claimeven: one per available pair; solves threats through its even square.
  for (const p of CLAIMEVEN_PAIRS) {
    const [lr, lc] = p.lower;
    const [ur, uc] = p.upper;
    if (board[lr][lc] !== 0 || board[ur][uc] !== 0) continue;
    const bKey = sq(ur, uc);
    const solves = new Set();
    for (const t of threats) if (t.keys.has(bKey)) solves.add(t.id);
    if (solves.size) apps.push({type: 'claimeven', uses: new Set([sq(lr, lc), bKey]), solves, detail: {a: [lr, lc], b: [ur, uc]}});
  }

  // ── Baseinverse: each pair of directly-playable squares; solves threats with both.
  const playable = [];
  for (let c = 0; c < COLS; c++) {
    const r = landingRow(board, c);
    if (r !== -1) playable.push([r, c]);
  }
  for (let i = 0; i < playable.length; i++) {
    for (let j = i + 1; j < playable.length; j++) {
      const [r1, c1] = playable[i];
      const [r2, c2] = playable[j];
      const k1 = sq(r1, c1);
      const k2 = sq(r2, c2);
      const solves = new Set();
      for (const t of threats) if (t.keys.has(k1) && t.keys.has(k2)) solves.add(t.id);
      if (solves.size) apps.push({type: 'baseinverse', uses: new Set([k1, k2]), solves, detail: {squares: [playable[i], playable[j]]}});
    }
  }

  // ── Aftereven: each aftereven group; solves solution-1 + the underlying claimevens (solution-2).
  for (const ag of afterevenGroups(board, controller)) {
    const uses = new Set();
    const evenKeys = [];
    for (const [r, c] of ag.evenEmpties) {
      uses.add(sq(r, c));
      uses.add(sq(r - 1, c));
      evenKeys.push(sq(r, c));
    }
    const solves = new Set();
    // Solution 2: threats through any of the aftereven's even (claimeven) squares.
    for (const t of threats) if (evenKeys.some(k => t.keys.has(k))) solves.add(t.id);
    // Solution 1: threats spanning above the empty in every aftereven column.
    const sol1 = new Set(threatsSolvedByAftereven(board, ag, controller).map(groupKey));
    for (const t of threats) if (sol1.has(t.key)) solves.add(t.id);
    if (solves.size) apps.push({type: 'aftereven', uses, solves, detail: {group: ag.cells}});
  }

  return apps;
}

/**
 * Attempt to prove the controller at least draws. Backtracking set-cover with
 * disjoint-squares consistency, most-constrained-threat first.
 * @returns {{solved, solution, threatCount, nodes}}
 */
export function solveVictor(board, controller = 2, opts = {}) {
  const threats = enumerateThreats(board, controller);
  const apps = enumerateRuleApps(board, threats, controller).filter(a => a.solves.size > 0);

  const solversOf = new Map(threats.map(t => [t.id, []]));
  for (const a of apps) for (const id of a.solves) solversOf.get(id).push(a);

  const used = new Set();
  const solved = new Set();
  const chosen = [];
  let nodes = 0;
  const cap = opts.nodeCap ?? 300000;

  const conflicts = app => {
    for (const s of app.uses) if (used.has(s)) return true;
    return false;
  };

  // Pick the unsolved threat with the fewest still-usable solvers (fail fast).
  const nextThreat = () => {
    let best = null;
    let bestCount = Infinity;
    for (const t of threats) {
      if (solved.has(t.id)) continue;
      let n = 0;
      for (const a of solversOf.get(t.id)) if (!conflicts(a)) n++;
      if (n < bestCount) {
        bestCount = n;
        best = t.id;
        if (n === 0) break; // dead end, stop early
      }
    }
    return {id: best, count: bestCount};
  };

  const search = () => {
    if (++nodes > cap) return false;
    const {id, count} = nextThreat();
    if (id === null) return true; // every threat solved
    if (count === 0) return false; // an unsolved threat has no consistent solver
    for (const app of solversOf.get(id)) {
      if (conflicts(app)) continue;
      const added = [];
      for (const s of app.uses) used.add(s);
      for (const tid of app.solves) if (!solved.has(tid)) (solved.add(tid), added.push(tid));
      chosen.push(app);
      if (search()) return true;
      chosen.pop();
      for (const s of app.uses) used.delete(s);
      for (const tid of added) solved.delete(tid);
    }
    return false;
  };

  const ok = search();
  return {solved: ok, solution: ok ? [...chosen] : null, threatCount: threats.length, nodes};
}
