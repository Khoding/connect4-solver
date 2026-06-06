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
 * Claimeven — the first of Victor Allis's threat-solution rules (Tier B), and
 * the backbone of the second player's defensive strategy.
 *
 * A *Claimeven* is a pair of vertically-adjacent empty squares in one column:
 * the lower square on an odd row, the even square directly above it. Because of
 * gravity the lower (odd) square must be filled before the upper (even) one, so
 * the second player can guarantee the even square simply by responding: whenever
 * the first player drops onto the odd square, the second player immediately
 * takes the even square above. This is how the second player "claims" the even
 * squares — the concrete mechanism behind even-threat theory (see threats.js).
 *
 * What a single Claimeven proves: the first player can never complete a winning
 * group through that even square, as long as the pair stays intact. That is a
 * *per-threat* guarantee. Combining several Claimevens to cover *all* of the
 * opponent's threats at once (the consistency/combination problem) is Tier C.
 *
 * Rows are 0-indexed from the bottom; row r has 1-indexed parity (r+1), so the
 * odd rows are r = 0,2,4 and the even rows are r = 1,3,5 (see rowParity).
 */

import {findThreatLines, landingRow, rowParity, ROWS, COLS} from './threats.js';

/**
 * The 21 Claimeven pairs (3 per column): a lower odd-row square and the even-row
 * square directly above it. Independent of board state.
 * @type {Array<{col: number, lower: [number, number], upper: [number, number]}>}
 */
export const CLAIMEVEN_PAIRS = (() => {
  const pairs = [];
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS - 1; r += 2) {
      // r is an odd-parity (lower) row; r + 1 an even-parity (upper) row.
      pairs.push({col: c, lower: [r, c], upper: [r + 1, c]});
    }
  }
  return pairs;
})();

/** Is square row `r` an even-parity row (a second-player square)? */
export function isEvenRow(r) {
  return rowParity(r) === 'even';
}

/** Claimeven pairs that are currently *available*: both squares still empty. */
export function availableClaimevens(board) {
  return CLAIMEVEN_PAIRS.filter(
    p => board[p.lower[0]][p.lower[1]] === 0 && board[p.upper[0]][p.upper[1]] === 0,
  );
}

/**
 * Even squares the second player can claim through an available claimeven — the
 * upper square of each intact pair, keyed `"r-c"`.
 * @returns {Set<string>}
 */
export function controlledEvenSquares(board) {
  const set = new Set();
  for (const p of availableClaimevens(board)) set.add(`${p.upper[0]}-${p.upper[1]}`);
  return set;
}

/**
 * First-mover (player 1) threats that the second player controls via claimeven:
 * a winning group whose completing square is the upper (even) square of an
 * available claimeven. Player 1 can never complete these — the moment it fills
 * the odd square below, the even square becomes the second player's reply.
 * @returns {Array<{row: number, col: number, cells: Array<[number, number]>}>}
 */
export function claimevenControlledThreats(board) {
  const controlled = controlledEvenSquares(board);
  const out = [];
  for (const line of findThreatLines(board, 1)) {
    if (controlled.has(`${line.row}-${line.col}`)) {
      out.push({row: line.row, col: line.col, cells: line.cells});
    }
  }
  return out;
}

/**
 * Is dropping into `col` a claimeven move for `player`? The literal Allis
 * response: the second player claims an even square sitting directly on top of a
 * first-mover disc (player 1 took the odd square below, player 2 takes the even
 * square above).
 */
export function isClaimevenMove(board, col, player) {
  if (player !== 2) return false;
  const r = landingRow(board, col);
  if (r === -1 || !isEvenRow(r)) return false; // must land on an even-parity row
  return board[r - 1][col] === 1; // directly above a first-mover disc
}
