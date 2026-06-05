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
 * Learn-mode "starter vocabulary" classifier.
 *
 * The strong WASM solver tells us *which* column is best for the player to
 * move, for both sides, in any position. It does not tell us *why*. This
 * module names the reason in plain steady-state language so Learn mode can
 * give a conceptual hint ("play a claimeven") instead of the raw column.
 *
 * This is the deliberately small v1 vocabulary:
 *   - win       : the move completes four in a row now
 *   - block     : the move denies the opponent's immediate four in a row
 *   - claimeven : the move takes an even square (1-indexed from the bottom)
 *   - claimodd  : the move takes an odd square
 *   - best      : fallback when none of the above apply
 *
 * Parity (claimeven/claimodd) is a heuristic here — true claimeven/claimodd
 * are threat-pairing strategies, not merely the parity of the square played.
 * A later "vocabulary" layer can refine these without changing this contract.
 */

const ROWS = 6;
const COLS = 7;

/** Lowest empty row (0-indexed from the bottom) for a column, or -1 if full. */
function landingRow(board, col) {
  for (let r = 0; r < ROWS; r++) {
    if (board[r][col] === 0) return r;
  }
  return -1;
}

/** Would `player` make four in a row by dropping into `col`? */
function wouldWin(board, col, player) {
  const r = landingRow(board, col);
  if (r === -1) return false;
  board[r][col] = player;
  const won = fourFrom(board, r, col, player);
  board[r][col] = 0;
  return won;
}

/** Is there a four in a row through cell (r, c) for `player`? */
function fourFrom(board, r, c, player) {
  const dirs = [
    [0, 1], // horizontal
    [1, 0], // vertical
    [1, 1], // diagonal /
    [1, -1], // diagonal \
  ];
  for (const [dr, dc] of dirs) {
    let count = 1;
    for (let sign = -1; sign <= 1; sign += 2) {
      for (let step = 1; step < 4; step++) {
        const nr = r + dr * step * sign;
        const nc = c + dc * step * sign;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) break;
        if (board[nr][nc] !== player) break;
        count++;
      }
    }
    if (count >= 4) return true;
  }
  return false;
}

/**
 * Pick the best column(s) from the solver's per-column scores.
 * Mirrors the store's interpretScores but returns 0-indexed helpers too.
 * @returns {{bestCols: number[], bestScore: number}|null} cols are 1-indexed
 */
function pickBest(scores) {
  let bestScore = -Infinity;
  let bestCols = [];
  for (let i = 0; i < COLS; i++) {
    if (scores[i] === -1000) continue; // unplayable
    if (scores[i] > bestScore) {
      bestScore = scores[i];
      bestCols = [i + 1];
    } else if (scores[i] === bestScore) {
      bestCols.push(i + 1);
    }
  }
  return bestCols.length ? {bestCols, bestScore} : null;
}

/**
 * Classify the best move into starter-vocabulary terms and build the per-cell
 * glyph overlay used by Hint 2.
 *
 * @param {number[][]} board - ROWS x COLS, 0 empty / 1 first mover / 2 second
 * @param {number[]} scores - 7 solver scores for the player to move
 * @param {number} player - internal player to move (1 or 2)
 * @returns {{concept: string, bestCol: number, bestCols: number[], cells: Array}|null}
 *   cells: {row, col, kind} where kind is one of
 *   'win' | 'block' | 'even' | 'odd' | 'best' | 'danger'
 */
export function classifyHint(board, scores, player) {
  if (!scores) return null;
  const best = pickBest(scores);
  if (!best) return null;

  const opponent = player === 1 ? 2 : 1;
  const {bestCols} = best;
  // Deterministic representative best column (lowest index) for the text hint.
  const bestCol = bestCols[0];
  const bestIdx = bestCol - 1;

  // Concept of the recommended move.
  let concept;
  if (wouldWin(board, bestIdx, player)) {
    concept = 'win';
  } else if (wouldWin(board, bestIdx, opponent)) {
    // Playing where the opponent would otherwise complete four = a block.
    concept = 'block';
  } else {
    const r = landingRow(board, bestIdx);
    const rowFromBottom = r + 1; // 1-indexed
    concept = rowFromBottom % 2 === 0 ? 'claimeven' : 'claimodd';
  }

  // Per-cell glyphs for the whole board (Hint 2).
  const cells = [];
  for (let c = 0; c < COLS; c++) {
    const r = landingRow(board, c);
    if (r === -1) continue; // full column
    const isBest = bestCols.includes(c + 1);

    let kind;
    if (wouldWin(board, c, player)) {
      kind = 'win';
    } else if (wouldWin(board, c, opponent)) {
      // The opponent could win here next turn — a square worth noticing.
      kind = isBest ? 'block' : 'danger';
    } else if (isBest) {
      kind = (r + 1) % 2 === 0 ? 'even' : 'odd';
    } else {
      continue; // unremarkable square, leave it unmarked
    }
    cells.push({row: r, col: c, kind});
  }

  return {concept, bestCol, bestCols, cells};
}
