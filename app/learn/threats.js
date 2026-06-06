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
 * Tier A threat-analysis engine — the rigorous core that replaces the v1
 * parity guess. This is pure board logic (no solver, no Vue) so it runs in
 * node for the validation harness and feeds the Learn-mode classifier.
 *
 * Vocabulary it grounds:
 *   - A *group* is any line of four collinear cells (69 of them on a 7x6 board).
 *   - A group is *winnable* by a player if it holds none of the opponent's discs.
 *   - A *threat* for a player is an empty square that completes a four for them
 *     (a group with that player's discs in the other three cells).
 *   - Odd/even threat theory: with rows numbered 1..6 from the bottom, the first
 *     mover profits from threats on odd rows, the second mover from even rows.
 *     This is what makes "odd threat" / "even threat" meaningful per player and
 *     is the seed the later Allis rules (claimeven, aftereven, …) grow from.
 *
 * Board convention (shared with the store): board[r][c], r indexed 0..ROWS-1
 * from the BOTTOM, 0 empty / 1 first mover / 2 second mover.
 */

const ROWS = 6;
const COLS = 7;

/**
 * All winning lines on the board, precomputed once. Each group is an array of
 * four [row, col] pairs.
 */
export const GROUPS = (() => {
  const dirs = [
    [0, 1], // horizontal
    [1, 0], // vertical
    [1, 1], // diagonal /
    [1, -1], // diagonal \
  ];
  const groups = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      for (const [dr, dc] of dirs) {
        const cells = [];
        for (let k = 0; k < 4; k++) {
          const nr = r + dr * k;
          const nc = c + dc * k;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) {
            cells.length = 0;
            break;
          }
          cells.push([nr, nc]);
        }
        if (cells.length === 4) groups.push(cells);
      }
    }
  }
  return groups;
})();

/** Row parity in the odd/even-threat sense (1-indexed from the bottom). */
export function rowParity(row) {
  return (row + 1) % 2 === 1 ? 'odd' : 'even';
}

/** Which parity of threat favours a given mover (1 = first → odd, 2 → even). */
export function favouredParity(player) {
  return player === 1 ? 'odd' : 'even';
}

/**
 * Every threatening group for `player`: a line of four holding three of their
 * discs and one empty square (the completing square), and none of the
 * opponent's. One entry per group, so a square reachable by two different lines
 * appears twice (each line is worth drawing).
 * @returns {Array<{row, col, parity, cells: Array<[number, number]>}>}
 *   row/col is the completing square; cells are all four group cells.
 */
export function findThreatLines(board, player) {
  const opponent = player === 1 ? 2 : 1;
  const lines = [];
  for (const group of GROUPS) {
    let mine = 0;
    let theirs = 0;
    let empty = null;
    let emptyCount = 0;
    for (const [r, c] of group) {
      const v = board[r][c];
      if (v === player) mine++;
      else if (v === opponent) theirs++;
      else {
        empty = [r, c];
        emptyCount++;
      }
    }
    if (theirs === 0 && mine === 3 && emptyCount === 1) {
      const [r, c] = empty;
      lines.push({row: r, col: c, parity: rowParity(r), cells: group.map(cell => [...cell])});
    }
  }
  return lines;
}

/**
 * All threat squares for `player`: empty cells that would complete a four.
 * @returns {Array<{row, col, parity, key}>} deduplicated, one per square
 */
export function findThreats(board, player) {
  const seen = new Map();
  for (const line of findThreatLines(board, player)) {
    const key = `${line.row}-${line.col}`;
    if (!seen.has(key)) {
      seen.set(key, {row: line.row, col: line.col, parity: line.parity, key});
    }
  }
  return [...seen.values()];
}

/** Lowest empty row (0-indexed from the bottom) in a column, or -1 if full. */
export function landingRow(board, col) {
  for (let r = 0; r < ROWS; r++) {
    if (board[r][col] === 0) return r;
  }
  return -1;
}

/** Does dropping into `col` complete a four for `player`? */
export function wouldWin(board, col, player) {
  const r = landingRow(board, col);
  if (r === -1) return false;
  for (const group of GROUPS) {
    let inGroup = false;
    let mine = 0;
    for (const [gr, gc] of group) {
      if (gr === r && gc === col) inGroup = true;
      if (board[gr][gc] === player) mine++;
    }
    if (inGroup && mine === 3) return true;
  }
  return false;
}

/** Return a deep copy of the board with `player` dropped into `col`. */
export function dropInto(board, col, player) {
  const r = landingRow(board, col);
  if (r === -1) return null;
  const next = board.map(row => row.slice());
  next[r][col] = player;
  return next;
}

export {ROWS, COLS};
