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
 * Baseinverse — Victor Allis's second threat-solution rule (Tier B).
 *
 * A *Baseinverse* is a pair of two directly-playable squares (each the lowest
 * empty square of its column). Because a player gets only one move at a time,
 * the opponent can never obtain both: the moment they take one, the controller
 * takes the other. So any group that needs both squares is refuted.
 *
 * Two directly-playable squares are always in different columns (each column
 * has exactly one playable square), which is the crux of the guarantee here.
 *
 * The application we name and validate is a *fork*: a group holding two of one
 * player's discs and two empty squares that are both directly playable. Filling
 * either empty turns the other into an immediate threat — but the opponent can
 * always block it, since that other square stays playable (different column).
 * The holder therefore cannot force the group through; combining several such
 * refutations to cover every threat at once is Tier C.
 *
 * Rows are 0-indexed from the bottom; board[r][c] is 0 empty / 1 first / 2 second.
 */

import {GROUPS, landingRow, COLS} from './threats.js';

/** Directly-playable squares: the landing square of each non-full column. */
export function playableSquares(board) {
  const out = [];
  for (let c = 0; c < COLS; c++) {
    const r = landingRow(board, c);
    if (r !== -1) out.push({row: r, col: c});
  }
  return out;
}

/** Is square (r,c) the directly-playable square of its column? */
export function isPlayable(board, r, c) {
  return landingRow(board, c) === r;
}

/**
 * Baseinverse forks held by `player`: a winnable group (no opponent disc) with
 * two of `player`'s discs and two empty squares that are both directly playable.
 * @returns {Array<{cells: Array<[number, number]>, empties: Array<[number, number]>}>}
 */
export function baseinverseForks(board, player) {
  const opponent = player === 1 ? 2 : 1;
  const out = [];
  for (const group of GROUPS) {
    let mine = 0;
    let theirs = 0;
    const empties = [];
    for (const [r, c] of group) {
      const v = board[r][c];
      if (v === player) mine++;
      else if (v === opponent) theirs++;
      else empties.push([r, c]);
    }
    if (theirs === 0 && mine === 2 && empties.length === 2) {
      const [a, b] = empties;
      if (isPlayable(board, a[0], a[1]) && isPlayable(board, b[0], b[1])) {
        out.push({cells: group.map(s => [...s]), empties: [a, b]});
      }
    }
  }
  return out;
}
