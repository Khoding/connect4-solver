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
 * Pairing presentation — Tier C, Phase 3. Turns a VICTOR proof (app/learn/
 * victor.js) into something the board and the Learn card can render: the
 * "pairing diagram" the app originally had, made rigorous by the solver-
 * validated rules.
 *
 * It runs the right prover for the position's solver verdict — `solveWhiteWin`
 * when the first player wins, `solveBlackWin` when the second player wins,
 * `solveVictor` (player 2 draws) otherwise — and only when a *proof* is actually
 * found. Because every prover is validated to zero false proofs against the
 * perfect solver, a returned pairing is sound: the listed rules really do force
 * the stated outcome.
 *
 * Squares are named in Allis notation (column letter a–g + row 1–6 from the
 * bottom), matching the thesis and the reference doc.
 */

import {solveVictor, solveWhiteWin, solveBlackWin} from './victor.js';
import {COLS} from './threats.js';

/** Allis square name: 0-indexed [row, col] → "a1".."g6". */
export function squareName(r, c) {
  return `${String.fromCharCode(97 + c)}${r + 1}`;
}

function bestPlayable(scores) {
  let best = -Infinity;
  for (let i = 0; i < COLS; i++) if (scores[i] !== -1000 && scores[i] > best) best = scores[i];
  return best;
}

/**
 * Build the renderable pairing for a position, or null if no rule-based proof
 * applies. `player` is the side to move (1 or 2).
 *
 * @returns {null | {
 *   kind: 'win' | 'draw',
 *   winner: 1 | 2 | null,                  // which player the win belongs to
 *   winKind: 'immediate' | 'oddThreat' | 'threatCombination' | 'aftereven' | null,
 *   groups: Array<{type, cells: Array<[number,number]>, squares: string[]}>,
 *   cells: Array<{row, col, type}>,        // every reserved square (deduped)
 *   counts: Record<string, number>,        // rule type → how many used
 *   anchor: null | {kind, ...},            // the odd threat / combination / immediate / aftereven
 *   threatsCovered: number,
 * }}
 */
export function buildPairing(board, scores, player) {
  if (!scores) return null;
  const best = bestPlayable(scores);
  if (best === -Infinity) return null;

  const whiteWins = player === 1 ? best > 0 : best < 0;
  const blackWins = player === 1 ? best < 0 : best > 0;
  const p2Holds = player === 2 ? best >= 0 : best <= 0;

  let kind = null;
  let winner = null;
  let res = null;
  if (whiteWins) {
    res = solveWhiteWin(board);
    if (res.solved) {
      kind = 'win';
      winner = 1;
    }
  } else if (blackWins) {
    res = solveBlackWin(board);
    if (res.solved) {
      kind = 'win';
      winner = 2;
    }
  } else if (p2Holds) {
    res = solveVictor(board, 2);
    if (res.solved) kind = 'draw';
  }
  if (!kind) return null;

  const solution = res.solution || [];
  const groups = solution.map(app => {
    const cells = [...app.uses].map(k => k.split('-').map(Number));
    return {type: app.type, cells, squares: cells.map(([r, c]) => squareName(r, c))};
  });

  // One marker per reserved square, tagged with the first rule that uses it.
  const seen = new Map();
  for (const g of groups) {
    for (const [r, c] of g.cells) {
      const key = `${r}-${c}`;
      if (!seen.has(key)) seen.set(key, {row: r, col: c, type: g.type});
    }
  }
  const cells = [...seen.values()];

  const counts = {};
  for (const g of groups) counts[g.type] = (counts[g.type] || 0) + 1;

  // The win anchor — what actually forces the win (the teaching focal point).
  // solveWhiteWin reports the sub-kind in `res.kind`.
  let anchor = null;
  if (kind === 'win') {
    if (res.kind === 'immediate') {
      anchor = {kind: 'immediate', col: res.winningCol + 1};
    } else if (res.kind === 'oddThreat' && res.oddThreat) {
      const {row, col, cells: gcells} = res.oddThreat;
      anchor = {kind: 'oddThreat', row, col, name: squareName(row, col), cells: gcells.map(s => [...s])};
    } else if (res.kind === 'aftereven' && res.afterevenGroup) {
      const gcells = res.afterevenGroup.map(s => [...s]);
      anchor = {kind: 'aftereven', cells: gcells, names: gcells.map(([r, c]) => squareName(r, c))};
    } else if (res.kind === 'threatCombination' && res.combination) {
      const cb = res.combination;
      anchor = {
        kind: 'threatCombination',
        type: cb.type,
        crossing: {row: cb.crossing[0], col: cb.crossing[1], name: squareName(cb.crossing[0], cb.crossing[1])},
        other: {row: cb.other[0], col: cb.other[1], name: squareName(cb.other[0], cb.other[1])},
      };
    }
  }

  return {kind, winner, winKind: kind === 'win' ? res.kind : null, groups, cells, counts, anchor, threatsCovered: res.threatCount ?? 0};
}
