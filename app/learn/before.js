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
 * Before — Victor Allis's most productive combination rule (§6.8); his own notes
 * call it "very important". A *Before group* is a group the controller could
 * still complete (it holds no opponent disc), none of whose empty squares lie in
 * the top row. The moment the opponent plays one of the group's empty squares,
 * the controller answers on the square directly above (its *successor*). So the
 * opponent can never hold every successor at once — any opponent group that needs
 * all of those successors is refuted, *before* the controller's group is even
 * completed (hence the name).
 *
 * Each empty square e of the Before group is, with its successor e+1, a Claimeven
 * (when e is odd-parity) or a Vertical (when e is even-parity). This module only
 * detects the geometric Before groups; the solve-sets and the consistency
 * metadata are assembled in victor.js. See docs/allis-rules-reference.md.
 *
 * Rows are 0-indexed from the bottom; the top row is r = ROWS - 1.
 */

import {GROUPS, ROWS} from './threats.js';

/**
 * Every Before group on the board for `controller`.
 * @returns {Array<{cells: Array<[number,number]>, empties: Array<[number,number]>}>}
 */
export function beforeGroups(board, controller = 2) {
  const opponent = controller === 1 ? 2 : 1;
  const out = [];
  for (const cells of GROUPS) {
    let ok = true;
    const empties = [];
    for (const [r, c] of cells) {
      const v = board[r][c];
      if (v === opponent) {
        ok = false;
        break;
      }
      if (v === 0) {
        if (r === ROWS - 1) {
          ok = false; // an empty square in the top row has no successor
          break;
        }
        empties.push([r, c]);
      }
    }
    if (ok && empties.length > 0) out.push({cells: cells.map(s => [...s]), empties});
  }
  return out;
}
