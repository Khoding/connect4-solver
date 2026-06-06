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
 * Vertical and Lowinverse — Victor Allis's odd-square rules (Tier B/C). These
 * give the even controller (player 2) a way to claim *odd* squares, which
 * claimeven/aftereven (even-square rules) can never do. They are the entry
 * point to solving the first mover's odd threats, the dominant gap left after
 * Phase 1 (see docs/tier-c-victor.md and [[learn-mode]]).
 *
 * VERTICAL (Allis): two empty squares in one column, directly above each other,
 * the LOWER square even-parity and the UPPER square odd-parity. Mechanism: the
 * opponent cannot take two squares in one column in a single turn, so whenever
 * the opponent plays the lower square the controller immediately plays the upper
 * (odd) one. The opponent therefore can never hold both squares. Because the two
 * squares share a column, only a *vertical* four can contain both — so a Vertical
 * solves exactly the vertical groups spanning its pair. It is the parity-mirror
 * of claimeven (claimeven: lower odd / upper even; vertical: lower even /
 * upper odd), and unlike claimeven it costs the controller an active response.
 *
 * LOWINVERSE (Allis): two Verticals in *different* columns (four empty squares,
 * both upper squares odd). "The sum of two odd numbers is even": the opponent
 * can hold at most one of the two upper (odd) squares — playing either lower
 * square is answered on top — so any group needing BOTH upper squares is solved.
 *
 * Rows are 0-indexed from the bottom; row r has 1-indexed parity (r+1). Odd
 * squares are r = 0,2,4; even squares are r = 1,3,5 (see rowParity). A Vertical's
 * lower square is therefore r = 1 or 3 and its upper square r = 2 or 4.
 */

import {ROWS, COLS} from './threats.js';

/**
 * The 14 Vertical pairs (2 per column): a lower even-parity square and the
 * odd-parity square directly above it. Independent of board state.
 * @type {Array<{col: number, lower: [number, number], upper: [number, number]}>}
 */
export const VERTICAL_PAIRS = (() => {
  const pairs = [];
  for (let c = 0; c < COLS; c++) {
    // r = 1, 3 are the even-parity lower rows; r + 1 = 2, 4 the odd-parity uppers.
    for (let r = 1; r < ROWS - 1; r += 2) {
      pairs.push({col: c, lower: [r, c], upper: [r + 1, c]});
    }
  }
  return pairs;
})();

/** Vertical pairs that are currently *available*: both squares still empty. */
export function availableVerticals(board) {
  return VERTICAL_PAIRS.filter(
    v => board[v.lower[0]][v.lower[1]] === 0 && board[v.upper[0]][v.upper[1]] === 0,
  );
}

/**
 * All Lowinverses available on the board: every unordered pair of available
 * Verticals lying in *different* columns.
 * @returns {Array<{a, b}>} a, b are VERTICAL_PAIRS entries
 */
export function availableLowinverses(board) {
  const verts = availableVerticals(board);
  const out = [];
  for (let i = 0; i < verts.length; i++) {
    for (let j = i + 1; j < verts.length; j++) {
      if (verts[i].col === verts[j].col) continue;
      out.push({a: verts[i], b: verts[j]});
    }
  }
  return out;
}

/**
 * The Highinverse triples (2 per column): three squares stacked, the upper
 * square even-parity (so the lower is at r = 1 or 3). A Highinverse pairs two of
 * these in *different* columns (Allis §6.6). Each triple is [low, mid, up],
 * bottom→top, as [row, col] pairs.
 * @type {Array<{col: number, squares: Array<[number, number]>}>}
 */
export const HIGHINVERSE_TRIPLES = (() => {
  const triples = [];
  for (let c = 0; c < COLS; c++) {
    // lower at r = 1, 3 → upper at r = 3, 5 (even-parity).
    for (let r = 1; r < ROWS - 2; r += 2) {
      triples.push({
        col: c,
        squares: [
          [r, c],
          [r + 1, c],
          [r + 2, c],
        ],
      });
    }
  }
  return triples;
})();

/** Highinverse triples with all three squares currently empty. */
export function availableHighinverseTriples(board) {
  return HIGHINVERSE_TRIPLES.filter(t => t.squares.every(([r, c]) => board[r][c] === 0));
}

/**
 * All Highinverses available on the board: every unordered pair of available
 * triples lying in *different* columns.
 * @returns {Array<{a, b}>} a, b are HIGHINVERSE_TRIPLES entries
 */
export function availableHighinverses(board) {
  const triples = availableHighinverseTriples(board);
  const out = [];
  for (let i = 0; i < triples.length; i++) {
    for (let j = i + 1; j < triples.length; j++) {
      if (triples[i].col === triples[j].col) continue;
      out.push({a: triples[i], b: triples[j]});
    }
  }
  return out;
}
