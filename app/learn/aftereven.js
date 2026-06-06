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
 * Aftereven — Victor Allis's third threat-solution rule (Tier B), built on top
 * of claimeven (see claimeven.js).
 *
 * An *aftereven group* is a group winnable by the even controller (player 2)
 * whose every empty square is an even square backed by an available claimeven
 * (the odd square directly below it is also empty). Player 2 can therefore claim
 * every gap in the line, one claimeven at a time — it controls the whole group.
 *
 * Allis's formal rule (thesis §6, "Aftereven"):
 *   Required:  a group completable by the controller using only the even squares
 *              of a set of Claimevens (the *aftereven group*). The columns of its
 *              empty squares are the *aftereven columns*.
 *   Solutions: (1) all opponent groups that have a square in EVERY aftereven
 *                  column, above that column's aftereven empty square; and
 *              (2) all groups solved by the underlying Claimevens.
 * The opponent chooses which aftereven column to fill last, so only groups that
 * need a square above the empty in *every* aftereven column are guaranteed dead
 * — hence the "all columns" condition (e.g. in diagram 6.5, c3-f3 is NOT solved
 * by the d2-g2 aftereven because it has no square in the g column).
 *
 * Solution (1) is encoded below and unit-tested against Allis's worked examples
 * (6.4 single-column, 6.5 two-column). Solution (2) is already covered by the
 * claimeven control machinery (see [[claimeven]]). Note that "solved" here is a
 * *combinational* guarantee — a single aftereven proves the controller wins only
 * once it (with other rules) covers ALL the opponent's threats; that whole-board
 * proof is the Tier-C combination solver, so these solved-threat sets are NOT
 * surfaced as a board overlay yet (it would mislead in isolation).
 */

import {GROUPS, rowParity} from './threats.js';
import {controlledEvenSquares} from './claimeven.js';

/**
 * Aftereven groups for the even controller (default player 2): a winnable group
 * (no opponent disc) whose every empty square is an even square backed by an
 * available claimeven.
 * @returns {Array<{cells: Array<[number, number]>, evenEmpties: Array<[number, number]>}>}
 */
export function afterevenGroups(board, player = 2) {
  const opponent = player === 1 ? 2 : 1;
  // Even squares the controller can claim right now (upper square of an
  // available claimeven — implies even parity with the odd square below empty).
  const controlled = controlledEvenSquares(board);
  const out = [];
  for (const group of GROUPS) {
    let blocked = false;
    const empties = [];
    for (const [r, c] of group) {
      const v = board[r][c];
      if (v === opponent) {
        blocked = true;
        break;
      }
      if (v === 0) empties.push([r, c]);
    }
    if (blocked || empties.length === 0) continue;
    // Every gap must be a claimeven-controlled even square.
    if (empties.every(([r, c]) => rowParity(r) === 'even' && controlled.has(`${r}-${c}`))) {
      out.push({cells: group.map(s => [...s]), evenEmpties: empties});
    }
  }
  return out;
}

/**
 * Map each aftereven column to the row of that column's aftereven empty square.
 * Aftereven groups are horizontal or diagonal (a vertical line can't have all
 * even gaps backed by claimevens), so there is exactly one empty per column;
 * the `Math.min` guard is just defensive.
 */
function afterevenColumnRows(ag) {
  const colRow = new Map();
  for (const [r, c] of ag.evenEmpties) {
    colRow.set(c, colRow.has(c) ? Math.min(colRow.get(c), r) : r);
  }
  return colRow;
}

/**
 * Opponent groups solved by a single aftereven group (Allis solution 1): every
 * aftereven column must contain a square of the group strictly above that
 * column's aftereven empty.
 * @returns {Array<Array<[number, number]>>} the solved opponent groups' cells
 */
export function threatsSolvedByAftereven(board, ag, player = 2) {
  const colRow = afterevenColumnRows(ag);
  const cols = [...colRow.keys()];
  const out = [];
  for (const group of GROUPS) {
    // Only the opponent's groups (lines the controller has no disc in).
    if (group.some(([r, c]) => board[r][c] === player)) continue;
    const spansAllAbove = cols.every(c =>
      group.some(([gr, gc]) => gc === c && gr > colRow.get(c)),
    );
    if (spansAllAbove) out.push(group.map(s => [...s]));
  }
  return out;
}

/**
 * All opponent groups solved by any aftereven on the board (solution 1), each
 * tagged with the aftereven group that solves it. Deduplicated by the group.
 * @returns {Array<{cells: Array<[number, number]>, via: Array<[number, number]>}>}
 */
export function afterevenSolvedThreats(board, player = 2) {
  const out = [];
  const seen = new Set();
  for (const ag of afterevenGroups(board, player)) {
    for (const g of threatsSolvedByAftereven(board, ag, player)) {
      const key = g.map(s => s.join(',')).join(';');
      if (!seen.has(key)) {
        seen.add(key);
        out.push({cells: g, via: ag.cells});
      }
    }
  }
  return out;
}
