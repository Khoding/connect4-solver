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
 * Baseclaim — Victor Allis's combination of two Baseinverses and a Claimeven
 * (§6.7). Required: three directly playable squares and the square z directly
 * above the *second* of them, with z on an even-parity row. Whichever first move
 * the opponent makes among the playable squares, the controller answers so that
 * either {p1, z} or {p2, p3} ends up containing one of the controller's squares.
 *
 * Solves: all groups containing {p1, z}, and all groups containing {p2, p3}.
 *
 * Rows are 0-indexed from the bottom; even-parity rows are r = 1, 3, 5. Because
 * each column has at most one directly playable square, p1/p2/p3 always sit in
 * three different columns and z sits in p2's column.
 */

import {landingRow, rowParity, ROWS, COLS} from './threats.js';

/**
 * Every Baseclaim available on the board.
 * @returns {Array<{p1:[number,number], p2:[number,number], p3:[number,number], z:[number,number]}>}
 *   p2 is the playable square whose successor z is even and empty; p1 pairs with
 *   z, p3 pairs with p2.
 */
export function baseclaimApps(board) {
  const playable = [];
  for (let c = 0; c < COLS; c++) {
    const r = landingRow(board, c);
    if (r !== -1) playable.push([r, c]);
  }

  const apps = [];
  for (const p2 of playable) {
    const zr = p2[0] + 1;
    if (zr >= ROWS) continue; // no square above
    if (rowParity(zr) !== 'even') continue; // the non-playable square must be even
    const z = [zr, p2[1]];
    // p1 (pairs with z) and p3 (pairs with p2) are two other playable squares.
    for (const p1 of playable) {
      if (p1 === p2) continue;
      for (const p3 of playable) {
        if (p3 === p2 || p3 === p1) continue;
        apps.push({p1, p2, p3, z});
      }
    }
  }
  return apps;
}
