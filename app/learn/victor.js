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
 * VICTOR combination solver — Tier C. See docs/tier-c-victor.md and the verbatim
 * rule reference in docs/allis-rules-reference.md.
 *
 * Given a position, tries to prove the even controller (player 2) can at least
 * draw: find a CONSISTENT set of rule applications whose solved threats cover
 * every one of the opponent's threats.
 *
 * Consistency is Allis's §7.4 pairwise table (claimeven/baseinverse/vertical/
 * aftereven/lowinverse/highinverse/baseclaim/before), NOT a plain disjoint-
 * squares test: Allis diagram 7.2 shows a Claimeven *below* a Lowinverse has
 * disjoint squares yet is inconsistent (it flips the Zugzwang parity). Each
 * application therefore carries the metadata the table needs — its squares, its
 * columns, its claimeven parts, and (for the inverses) its column footprint.
 * Soundness is checked against the perfect solver: `npm run test:victor`.
 */

import {GROUPS, landingRow, rowParity, ROWS, COLS} from './threats.js';
import {CLAIMEVEN_PAIRS} from './claimeven.js';
import {afterevenGroups, threatsSolvedByAftereven} from './aftereven.js';
import {VERTICAL_PAIRS, availableLowinverses, availableHighinverses} from './vertical.js';
import {beforeGroups} from './before.js';
import {baseclaimApps} from './baseclaim.js';

const sq = (r, c) => `${r}-${c}`;
const rowOf = key => Number(key.slice(0, key.indexOf('-')));
const colOf = key => Number(key.slice(key.indexOf('-') + 1));
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
 * Build a rule application with the metadata the consistency table needs.
 * @param type        rule name (keys of CONSISTENCY)
 * @param usesKeys    square keys the rule reserves
 * @param solves      Set<threatId>
 * @param opts.cols   override columns (defaults to columns of usesKeys)
 * @param opts.claimevenUppers  [{row,col}] upper squares of the rule's claimeven parts
 * @param opts.inverseCols      {col: lowestReservedRow} if the rule is an inverse (LI/HI)
 */
function makeApp(type, usesKeys, solves, opts = {}) {
  const uses = new Set(usesKeys);
  const cols = opts.cols ?? new Set([...uses].map(colOf));
  return {
    type,
    uses,
    solves,
    cols,
    claimevenUppers: opts.claimevenUppers ?? [],
    inverseCols: opts.inverseCols ?? null,
    detail: opts.detail,
  };
}

/**
 * Every available rule application, each tagged with the threat ids it solves
 * and the metadata the consistency table needs.
 */
export function enumerateRuleApps(board, threats, controller = 2) {
  const apps = [];
  const solvesContainingAll = (...keys) => {
    const s = new Set();
    for (const t of threats) if (keys.every(k => t.keys.has(k))) s.add(t.id);
    return s;
  };
  const playable = [];
  for (let c = 0; c < COLS; c++) {
    const r = landingRow(board, c);
    if (r !== -1) playable.push([r, c]);
  }
  const isPlayable = (r, c) => playable.some(([pr, pc]) => pr === r && pc === c);

  // ── Claimeven: solves threats through its even (upper) square.
  for (const p of CLAIMEVEN_PAIRS) {
    const [lr, lc] = p.lower;
    const [ur, uc] = p.upper;
    if (board[lr][lc] !== 0 || board[ur][uc] !== 0) continue;
    const solves = solvesContainingAll(sq(ur, uc));
    if (solves.size)
      apps.push(
        makeApp('claimeven', [sq(lr, lc), sq(ur, uc)], solves, {
          claimevenUppers: [{row: ur, col: uc}],
          detail: {a: [lr, lc], b: [ur, uc]},
        }),
      );
  }

  // ── Baseinverse: two directly-playable squares; solves threats containing both.
  for (let i = 0; i < playable.length; i++) {
    for (let j = i + 1; j < playable.length; j++) {
      const [r1, c1] = playable[i];
      const [r2, c2] = playable[j];
      const solves = solvesContainingAll(sq(r1, c1), sq(r2, c2));
      if (solves.size) apps.push(makeApp('baseinverse', [sq(r1, c1), sq(r2, c2)], solves, {detail: {squares: [playable[i], playable[j]]}}));
    }
  }

  // ── Vertical: lower even / upper odd; solves vertical groups containing both.
  for (const v of VERTICAL_PAIRS) {
    const [lr, lc] = v.lower;
    const [ur, uc] = v.upper;
    if (board[lr][lc] !== 0 || board[ur][uc] !== 0) continue;
    const solves = solvesContainingAll(sq(lr, lc), sq(ur, uc));
    if (solves.size) apps.push(makeApp('vertical', [sq(lr, lc), sq(ur, uc)], solves, {detail: {a: [lr, lc], b: [ur, uc]}}));
  }

  // ── Lowinverse: two Verticals in different columns; solves groups with both upper odd squares.
  for (const {a, b} of availableLowinverses(board)) {
    const u1 = sq(a.upper[0], a.upper[1]);
    const u2 = sq(b.upper[0], b.upper[1]);
    const l1 = sq(a.lower[0], a.lower[1]);
    const l2 = sq(b.lower[0], b.lower[1]);
    const solves = solvesContainingAll(u1, u2);
    if (solves.size)
      apps.push(
        makeApp('lowinverse', [l1, u1, l2, u2], solves, {
          inverseCols: {[a.col]: a.lower[0], [b.col]: b.lower[0]},
          detail: {uppers: [a.upper, b.upper]},
        }),
      );
  }

  // ── Highinverse: two columns × 3 stacked empties, upper even.
  for (const {a, b} of availableHighinverses(board)) {
    const [lo1, mid1, up1] = a.squares; // [row,col] bottom→top
    const [lo2, mid2, up2] = b.squares;
    const k = ([r, c]) => sq(r, c);
    const solves = new Set();
    // (1) both upper, (2) both middle, (3) mid+up of one column.
    for (const t of threats) {
      if ((t.keys.has(k(up1)) && t.keys.has(k(up2))) || (t.keys.has(k(mid1)) && t.keys.has(k(mid2)))) solves.add(t.id);
      else if ((t.keys.has(k(mid1)) && t.keys.has(k(up1))) || (t.keys.has(k(mid2)) && t.keys.has(k(up2)))) solves.add(t.id);
    }
    // (4)/(5) lower-of-one-column (if directly playable) + upper-of-the-other.
    if (isPlayable(lo1[0], lo1[1])) for (const t of threats) if (t.keys.has(k(lo1)) && t.keys.has(k(up2))) solves.add(t.id);
    if (isPlayable(lo2[0], lo2[1])) for (const t of threats) if (t.keys.has(k(lo2)) && t.keys.has(k(up1))) solves.add(t.id);
    if (solves.size)
      apps.push(
        makeApp('highinverse', [k(lo1), k(mid1), k(up1), k(lo2), k(mid2), k(up2)], solves, {
          inverseCols: {[lo1[1]]: lo1[0], [lo2[1]]: lo2[0]},
          detail: {cols: [lo1[1], lo2[1]]},
        }),
      );
  }

  // ── Aftereven: solution-1 (spanning columns) + solution-2 (constituent claimevens).
  for (const ag of afterevenGroups(board, controller)) {
    const uses = [];
    const evenKeys = [];
    const claimevenUppers = [];
    for (const [r, c] of ag.evenEmpties) {
      uses.push(sq(r, c), sq(r - 1, c));
      evenKeys.push(sq(r, c));
      claimevenUppers.push({row: r, col: c});
    }
    const solves = new Set();
    for (const t of threats) if (evenKeys.some(key => t.keys.has(key))) solves.add(t.id);
    const sol1 = new Set(threatsSolvedByAftereven(board, ag, controller).map(groupKey));
    for (const t of threats) if (sol1.has(t.key)) solves.add(t.id);
    if (solves.size) apps.push(makeApp('aftereven', uses, solves, {claimevenUppers, detail: {group: ag.cells}}));
  }

  // ── Baseclaim: {p1,z} and {p2,p3}; z even, directly above playable p2.
  for (const bc of baseclaimApps(board)) {
    const {p1, p2, p3, z} = bc;
    const solves = new Set();
    for (const t of threats) {
      if (t.keys.has(sq(p1[0], p1[1])) && t.keys.has(sq(z[0], z[1]))) solves.add(t.id);
      else if (t.keys.has(sq(p2[0], p2[1])) && t.keys.has(sq(p3[0], p3[1]))) solves.add(t.id);
    }
    if (solves.size)
      apps.push(
        makeApp('baseclaim', [sq(p1[0], p1[1]), sq(p2[0], p2[1]), sq(p3[0], p3[1]), sq(z[0], z[1])], solves, {
          claimevenUppers: [{row: z[0], col: z[1]}],
          detail: bc,
        }),
      );
  }

  // ── Before: solves threats containing ALL successors of the group's empties,
  //    plus the side-effects of its claimeven (e odd) and vertical (e even) parts.
  for (const bg of beforeGroups(board, controller)) {
    const successors = bg.empties.map(([r, c]) => sq(r + 1, c));
    const uses = [];
    const claimevenUppers = [];
    for (const [r, c] of bg.empties) {
      uses.push(sq(r, c), sq(r + 1, c));
      if (rowParity(r) === 'odd') claimevenUppers.push({row: r + 1, col: c}); // (e,e+1) is a Claimeven
    }
    const solves = solvesContainingAll(...successors);
    // Side effects: each claimeven part solves threats through its even square;
    // each vertical part solves threats through both its squares.
    for (const [r, c] of bg.empties) {
      if (rowParity(r) === 'odd') {
        for (const t of threats) if (t.keys.has(sq(r + 1, c))) solves.add(t.id);
      } else {
        for (const t of threats) if (t.keys.has(sq(r, c)) && t.keys.has(sq(r + 1, c))) solves.add(t.id);
      }
    }
    if (solves.size) apps.push(makeApp('before', uses, solves, {claimevenUppers, detail: {group: bg.cells}}));
  }

  // NOTE: Specialbefore (Allis §6.9) is deliberately NOT enumerated. Its formal
  // solve-set ("all successors AND the extra playable square" + "the two playable
  // squares") is ambiguous in the thesis, and a literal reading produced false
  // proofs against the solver in combination (it over-claims). Allis himself
  // rates its impact "probably not significant", so rather than ship a rule we
  // cannot prove sound we omit it. The consistency table keeps its row for when a
  // confirmed semantics is encoded. Soundness > coverage.

  return apps;
}

// ── Consistency (Allis §7.4) ────────────────────────────────────────────────

// Pairwise constraint codes. Lower-triangular table, symmetric on lookup.
const ORDER = ['claimeven', 'baseinverse', 'vertical', 'aftereven', 'lowinverse', 'highinverse', 'baseclaim', 'before', 'specialbefore'];
// prettier-ignore
const TABLE = [
  ['1'],
  ['1', '1'],
  ['1', '1', '1'],
  ['1', '1', '1', '3'],
  ['2', '1', '1', '1&2', '4'],
  ['2', '1', '1', '1&2', '4', '4'],
  ['1', '1', '1', '1', '1&2', '1&2', '1'],
  ['1', '1', '1', '3', '2&3', '1&2', '1', '3'],
  ['1', '1', '1', '3', '2&3', '1&2', '1', '3', '3'],
];
function constraintCode(t1, t2) {
  const i = ORDER.indexOf(t1);
  const j = ORDER.indexOf(t2);
  const [hi, lo] = i >= j ? [i, j] : [j, i];
  return TABLE[hi][lo];
}

const disjointSquares = (a, b) => {
  for (const s of a.uses) if (b.uses.has(s)) return false;
  return true;
};

// No Claimeven of the non-inverse rule lies below the inverse in a shared column.
function noClaimevenBelowInverse(a, b) {
  const inv = a.inverseCols ? a : b.inverseCols ? b : null;
  if (!inv) return true;
  const other = inv === a ? b : a;
  for (const {row, col} of other.claimevenUppers) {
    const low = inv.inverseCols[col];
    if (low !== undefined && row < low) return false;
  }
  return true;
}

// Per column, the two rules use the identical square set, or one uses none.
function columnWiseDisjointOrEqual(a, b) {
  const byCol = app => {
    const m = new Map();
    for (const s of app.uses) {
      const c = colOf(s);
      if (!m.has(c)) m.set(c, new Set());
      m.get(c).add(s);
    }
    return m;
  };
  const ma = byCol(a);
  const mb = byCol(b);
  for (const [c, sa] of ma) {
    const sb = mb.get(c);
    if (!sb) continue;
    if (sa.size !== sb.size) return false;
    for (const s of sa) if (!sb.has(s)) return false;
  }
  return true;
}

// The two inverses' column footprints are disjoint or identical.
function inverseColsDisjointOrEqual(a, b) {
  const ca = Object.keys(a.inverseCols);
  const cb = new Set(Object.keys(b.inverseCols));
  const shared = ca.filter(c => cb.has(c));
  if (shared.length === 0) return true;
  return ca.length === cb.size && shared.length === ca.length;
}

/** Can rule applications a and b be combined? (Allis §7.4) */
export function consistent(a, b) {
  switch (constraintCode(a.type, b.type)) {
    case '1':
      return disjointSquares(a, b);
    case '2':
      // Disjoint squares too: a non-disjoint CL–LI/HI is always a claimeven that
      // shares the inverse's lower square (i.e. sits below it), which "2" forbids.
      return disjointSquares(a, b) && noClaimevenBelowInverse(a, b);
    case '3':
      return columnWiseDisjointOrEqual(a, b);
    case '4':
      return disjointSquares(a, b) && inverseColsDisjointOrEqual(a, b);
    case '1&2':
      return disjointSquares(a, b) && noClaimevenBelowInverse(a, b);
    case '2&3':
      return noClaimevenBelowInverse(a, b) && columnWiseDisjointOrEqual(a, b);
    default:
      return false;
  }
}

/**
 * Backtracking set-cover with Allis consistency, most-constrained-threat first.
 * Finds a consistent subset of `apps` whose solved threats cover every threat.
 * @returns {{solved, solution, nodes}}
 */
function runCover(threats, apps, cap = 300000) {
  const solversOf = new Map(threats.map(t => [t.id, []]));
  for (const a of apps) for (const id of a.solves) if (solversOf.has(id)) solversOf.get(id).push(a);

  const solved = new Set();
  const chosen = [];
  let nodes = 0;

  const conflicts = app => {
    for (const c of chosen) if (!consistent(app, c)) return true;
    return false;
  };

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
        if (n === 0) break;
      }
    }
    return {id: best, count: bestCount};
  };

  const search = () => {
    if (++nodes > cap) return false;
    const {id, count} = nextThreat();
    if (id === null) return true;
    if (count === 0) return false;
    for (const app of solversOf.get(id)) {
      if (conflicts(app)) continue;
      const added = [];
      for (const tid of app.solves) if (!solved.has(tid)) (solved.add(tid), added.push(tid));
      chosen.push(app);
      if (search()) return true;
      chosen.pop();
      for (const tid of added) solved.delete(tid);
    }
    return false;
  };

  const ok = search();
  return {solved: ok, solution: ok ? [...chosen] : null, nodes};
}

/**
 * Attempt to prove the controller (player 2) at least draws: refute every
 * opponent threat with a consistent set of strategic rules.
 * @returns {{solved, solution, threatCount, nodes}}
 */
export function solveVictor(board, controller = 2, opts = {}) {
  const threats = enumerateThreats(board, controller);
  const apps = enumerateRuleApps(board, threats, controller).filter(a => a.solves.size > 0);
  const res = runCover(threats, apps, opts.nodeCap ?? 300000);
  return {...res, threatCount: threats.length};
}

/**
 * Attempt to prove player 2 (Black) WINS outright, not merely draws.
 *
 * Allis §9.2 (his own "minor modification"): if a drawing cover contains an
 * Aftereven, Black does not just hold — it WINS. The aftereven group is a Black
 * line of four whose every gap is an even square Black is guaranteed via
 * claimeven; once the drawing plan also refutes all of White's threats, Black is
 * free to complete that four. So a Black win is the existing draw engine plus a
 * one-line check on the chosen cover — the natural mirror of the White-win
 * prover (which keys off an *odd* threat instead).
 *
 * Because Black controls the Zugzwang only while White holds no odd threat, this
 * is self-protecting: an unrefuted White odd threat is an unsolvable group (3
 * White discs + 1 odd empty — no rule touches it), so the cover cannot close and
 * no win is claimed. Validated against the solver: `npm run test:victor:black`.
 * @returns {{solved, kind, afterevenGroup, winningCol, solution, threatCount, nodes}}
 */
export function solveBlackWin(board, opts = {}) {
  const cap = opts.nodeCap ?? 300000;
  let discs = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (board[r][c]) discs++;
  const blackToMove = discs % 2 === 1; // Black moves second

  // Trivial: Black to move with a directly-playable winning square.
  if (blackToMove) {
    for (let c = 0; c < COLS; c++) {
      const r = landingRow(board, c);
      if (r === -1) continue;
      if (GROUPS.some(g => g.some(([gr, gc]) => gr === r && gc === c) && g.filter(([gr, gc]) => board[gr][gc] === 2).length === 3 && g.every(([gr, gc]) => board[gr][gc] !== 1))) {
        return {solved: true, kind: 'immediate', winningCol: c, afterevenGroup: null, solution: [], threatCount: 0, nodes: 0};
      }
    }
  }

  const threats = enumerateThreats(board, 2);
  const apps = enumerateRuleApps(board, threats, 2).filter(a => a.solves.size > 0);
  const res = runCover(threats, apps, cap);
  if (res.solved) {
    const ae = res.solution.find(a => a.type === 'aftereven');
    if (ae) return {solved: true, kind: 'aftereven', afterevenGroup: ae.detail?.group ?? null, winningCol: null, solution: res.solution, threatCount: threats.length, nodes: res.nodes};
  }
  return {solved: false, kind: null, afterevenGroup: null, winningCol: null, solution: null, threatCount: threats.length, nodes: res.nodes};
}

// ── Player-1 (White) win prover (Allis §8.2) ─────────────────────────────────

/**
 * White's odd threats: a group with three of White's (player 1) discs and one
 * empty square, that square on an odd-parity row and NOT directly playable (a
 * standing threat). An odd threat hands White control of the Zugzwang.
 * @returns {Array<{cells, row, col}>}
 */
export function findOddThreats(board) {
  const out = [];
  for (const cells of GROUPS) {
    let white = 0;
    let black = 0;
    let empty = null;
    let empties = 0;
    for (const [r, c] of cells) {
      const v = board[r][c];
      if (v === 1) white++;
      else if (v === 2) black++;
      else {
        empty = [r, c];
        empties++;
      }
    }
    if (black === 0 && white === 3 && empties === 1) {
      const [er, ec] = empty;
      if (rowParity(er) === 'odd' && landingRow(board, ec) !== er) out.push({cells, row: er, col: ec});
    }
  }
  return out;
}

/**
 * Threat combinations (Allis §8.4): two White half-groups (each 2 discs + 2
 * empties). The *odd group* needs two odd squares; the *even group* needs one of
 * them — the *crossing square* (shared, not directly playable) — plus an even
 * square directly above/below the *other* odd square, in that other column.
 * Together they force White an odd threat in one of the two columns.
 * @returns {Array<{crossing:[number,number], other:[number,number], even:[number,number], type, crossCol, otherCol}>}
 */
export function findThreatCombinations(board) {
  const halves = [];
  for (const cells of GROUPS) {
    let w = 0;
    let b = 0;
    const empties = [];
    for (const [r, c] of cells) {
      const v = board[r][c];
      if (v === 1) w++;
      else if (v === 2) b++;
      else empties.push([r, c]);
    }
    if (b === 0 && w === 2 && empties.length === 2) halves.push({empties});
  }
  const eq = (p, q) => p[0] === q[0] && p[1] === q[1];
  const combos = [];
  for (const og of halves) {
    if (!og.empties.every(([r]) => rowParity(r) === 'odd')) continue; // odd group: both empties odd
    for (const eg of halves) {
      if (eg === og) continue;
      const oddE = eg.empties.filter(([r]) => rowParity(r) === 'odd');
      const evenE = eg.empties.filter(([r]) => rowParity(r) === 'even');
      if (oddE.length !== 1 || evenE.length !== 1) continue; // even group: one odd (shared) + one even
      const crossing = oddE[0];
      const E = evenE[0];
      if (!og.empties.some(s => eq(s, crossing))) continue; // shared square is in the odd group
      const other = og.empties.find(s => !eq(s, crossing)); // the other odd square
      if (E[1] !== other[1] || Math.abs(E[0] - other[0]) !== 1) continue; // E adjacent to O, same column
      if (landingRow(board, crossing[1]) === crossing[0]) continue; // crossing not directly playable
      combos.push({crossing, other, even: E, type: E[0] - other[0] === 1 ? 'evenAboveOdd' : 'oddAboveEven', crossCol: crossing[1], otherCol: other[1]});
    }
  }
  return combos;
}

/**
 * Attempt to prove White (player 1) wins. Either White has an immediate winning
 * move, or White holds an odd threat — or a threat combination that forces one —
 * giving Zugzwang control, and can refute every one of Black's threats on the
 * rest of the board with a consistent set of the strategic rules. The
 * threat/combination columns are reserved (Black can never reach the squares
 * White owns there, Allis §8.2/§8.4), so those threats are dead for free and
 * rules are forbidden from using those columns.
 * @returns {{solved, kind, oddThreat, combination, winningCol, solution, threatCount, nodes}}
 */
export function solveWhiteWin(board, opts = {}) {
  const cap = opts.nodeCap ?? 300000;
  let discs = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (board[r][c]) discs++;
  const whiteToMove = discs % 2 === 0; // White moves first

  // Trivial: White to move with a directly-playable winning square.
  if (whiteToMove) {
    for (let c = 0; c < COLS; c++) {
      const r = landingRow(board, c);
      if (r === -1) continue;
      if (GROUPS.some(g => g.some(([gr, gc]) => gr === r && gc === c) && g.filter(([gr, gc]) => board[gr][gc] === 1).length === 3 && g.every(([gr, gc]) => board[gr][gc] !== 2))) {
        return {solved: true, kind: 'immediate', winningCol: c, oddThreat: null, solution: [], threatCount: 0, nodes: 0};
      }
    }
  }

  const oddThreats = findOddThreats(board);
  let totalNodes = 0;
  for (const T of oddThreats) {
    // Black's threats, minus those the odd threat kills (a square in T's column
    // at or above the threat row — Black can never get there).
    const remaining = enumerateThreats(board, 1).filter(t => !t.cells.some(([r, c]) => c === T.col && r >= T.row));
    // Rules may not use the odd-threat column; White owns it via the threat.
    const apps = enumerateRuleApps(board, remaining, 1).filter(a => a.solves.size > 0 && ![...a.uses].some(key => colOf(key) === T.col));
    const res = runCover(remaining, apps, cap);
    totalNodes += res.nodes;
    if (res.solved) return {solved: true, kind: 'oddThreat', oddThreat: T, combination: null, winningCol: null, solution: res.solution, threatCount: remaining.length, nodes: totalNodes};
  }

  // Threat combinations: force an odd threat across two columns (§8.4). All of
  // Allis's per-type claims (1–6 / 1–4) are encoded — see the verbatim text in
  // docs/allis-rules-reference.md. Claims that say "Black cannot get square X"
  // kill threats; claims that hand White a square (the lowest-squares Baseinverse,
  // and the answered pairing in the other column) instead RELAX the otherwise
  // total reservation of the two columns.
  for (const tc of findThreatCombinations(board)) {
    const xc = tc.crossCol;
    const oc = tc.otherCol;
    const xRow = tc.crossing[0];
    const oRow = tc.other[0];
    const lowestX = landingRow(board, xc); // first empty (playable) row of the crossing column
    const lowestO = landingRow(board, oc);
    const oPlayable = lowestO === oRow; // the other odd square is directly playable
    const evenAbove = tc.type === 'evenAboveOdd';

    const dead = t => {
      const inCol = (cc, pred) => t.cells.some(([r, c]) => c === cc && pred(r));
      const at = (rr, cc) => t.cells.some(([r, c]) => r === rr && c === cc);
      // Claim 1 (both types): Black gets no odd square in the crossing column
      // above the first directly playable square.
      if (inCol(xc, r => rowParity(r) === 'odd' && r > lowestX)) return true;
      const aboveX = inCol(xc, r => r > xRow);
      // Claim 2 (both types): not both a square above the crossing AND a square
      // above the other odd square (White has already won by then).
      if (aboveX && inCol(oc, r => r > oRow)) return true;
      if (evenAbove) {
        // Type-1 claim 3: not both a square above the crossing AND the other odd square itself.
        if (aboveX && at(oRow, oc)) return true;
        // Type-1 claim 4: if the other odd square is playable, Black's highest in
        // the crossing column is the square directly above the crossing square.
        if (oPlayable && inCol(xc, r => r > xRow + 1)) return true;
      }
      return false;
    };
    const remaining = enumerateThreats(board, 1).filter(t => !dead(t));

    // Reserve both columns, except the two relaxations Allis grants:
    //  · the lowest-squares Baseinverse (type-1 claim 5 / type-2 claim 3): only
    //    when the crossing column's first empty is odd and the other odd square
    //    is not directly playable — then White is guaranteed one of the two bases;
    //  · the answered pairing in the other column (type-1 claim 6 / type-2 claim
    //    4): White answers every move there up to the odd square, a Vertical's
    //    guarantee — so Verticals confined to the other column at/below oRow are
    //    sound even though the column is otherwise reserved.
    const biAllowed = rowParity(lowestX) === 'odd' && !oPlayable;
    const allowedApp = a => {
      const usesXC = [...a.uses].some(k => colOf(k) === xc);
      const usesOC = [...a.uses].some(k => colOf(k) === oc);
      if (!usesXC && !usesOC) return true;
      if (biAllowed && a.type === 'baseinverse' && a.uses.size === 2 && a.uses.has(sq(lowestX, xc)) && a.uses.has(sq(lowestO, oc))) return true;
      if (a.type === 'vertical' && !usesXC && [...a.uses].every(k => colOf(k) === oc && rowOf(k) <= oRow)) return true;
      return false;
    };
    const apps = enumerateRuleApps(board, remaining, 1).filter(a => a.solves.size > 0 && allowedApp(a));
    const res = runCover(remaining, apps, cap);
    totalNodes += res.nodes;
    if (res.solved) return {solved: true, kind: 'threatCombination', oddThreat: null, combination: tc, winningCol: null, solution: res.solution, threatCount: remaining.length, nodes: totalNodes};
  }

  return {solved: false, kind: null, oddThreat: null, combination: null, winningCol: null, solution: null, threatCount: 0, nodes: totalNodes};
}
