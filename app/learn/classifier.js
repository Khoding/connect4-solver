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
 * Learn-mode classifier (Tier A).
 *
 * The strong WASM solver chooses *which* column is best, for either player, in
 * any position — including positions reached by mistakes, since it re-evaluates
 * the board from scratch every move. This module names *why* in steady-state
 * language, grounded in real odd/even threat analysis (see threats.js) rather
 * than the v1 landing-row parity guess.
 *
 * Concepts emitted (the move-to-play's reason):
 *   - win        : completes four now
 *   - block      : denies the opponent's immediate four
 *   - odd_threat : creates a new threat on an odd row (the first mover's weapon)
 *   - even_threat: creates a new threat on an even row (the second mover's weapon)
 *   - claimeven  : the second player claims an even square above the opponent's
 *                  (Allis's claimeven rule — see claimeven.js); a refinement of
 *                  `develop` for the second player's quiet even-control moves
 *   - develop    : best move with no new immediate threat to name (positional)
 *
 * Later Allis rules (aftereven, baseinverse, …) refine `develop` and `*_threat`
 * further without changing this contract or the solver-driven move choice.
 */

import {
  findThreats,
  findThreatLines,
  wouldWin,
  dropInto,
  landingRow,
  favouredParity,
  COLS,
} from './threats.js';
import {isClaimevenMove, claimevenControlledThreats} from './claimeven.js';
import {baseinverseForks} from './baseinverse.js';

/**
 * Pick the best column(s) from the solver's per-column scores.
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

/** Threats in `after` keyed by square that were not present in `before`. */
function newThreats(before, after) {
  const had = new Set(before.map(t => t.key));
  return after.filter(t => !had.has(t.key));
}

/**
 * Classify the best move into Tier-A vocabulary and build the board overlay.
 *
 * @param {number[][]} board - ROWS x COLS, 0 empty / 1 first mover / 2 second
 * @param {number[]} scores - 7 solver scores for the player to move
 * @param {number} player - internal player to move (1 or 2)
 * @returns {{concept, bestCol, bestCols, parity, cells}|null}
 *   cells: {row, col, kind} where kind is
 *   'win' | 'block' | 'play' | 'opportunity' | 'danger' | 'controlled'
 *   ('controlled' = an opponent threat a Tier-B rule refutes, e.g. a claimeven-
 *   controlled even threat — shown calmly rather than as red danger.)
 */
export function classifyHint(board, scores, player) {
  if (!scores) return null;
  const best = pickBest(scores);
  if (!best) return null;

  const opponent = player === 1 ? 2 : 1;
  const {bestCols} = best;
  const bestCol = bestCols[0]; // deterministic representative for the text hint
  const bestIdx = bestCol - 1;

  // ── Name the recommended move ──────────────────────────────
  let concept;
  let parity = null;

  if (wouldWin(board, bestIdx, player)) {
    concept = 'win';
  } else if (wouldWin(board, bestIdx, opponent)) {
    concept = 'block';
  } else {
    // Does playing the recommended column create a new threat for the mover?
    const before = findThreats(board, player);
    const next = dropInto(board, bestIdx, player);
    const created = next ? newThreats(before, findThreats(next, player)) : [];
    if (created.length) {
      // Prefer to name the parity that actually helps this mover.
      const favour = favouredParity(player);
      const pick = created.find(t => t.parity === favour) ?? created[0];
      parity = pick.parity;
      concept = pick.parity === 'odd' ? 'odd_threat' : 'even_threat';
    } else if (isClaimevenMove(board, bestIdx, player)) {
      // No new threat, but the second player is claiming an even square right
      // above the opponent's — the claimeven, their core defensive move.
      concept = 'claimeven';
    } else {
      concept = 'develop';
    }
  }

  // ── Board overlay (Hint 2) ─────────────────────────────────
  const cells = [];
  const mark = (row, col, kind) => cells.push({row, col, kind});

  // Opponent threats the second player refutes via claimeven (an even square it
  // controls): shown 'controlled' instead of 'danger'. Tier B only — claimeven
  // is the second player's tool, so this applies when player 2 is to move.
  const controlledKeys = new Set();
  if (player === 2) {
    for (const t of claimevenControlledThreats(board)) controlledKeys.add(`${t.row}-${t.col}`);
  }

  // Threat squares for both sides — the heart of what Tier A teaches.
  for (const t of findThreats(board, player)) mark(t.row, t.col, 'opportunity');
  for (const t of findThreats(board, opponent)) {
    mark(t.row, t.col, controlledKeys.has(t.key) ? 'controlled' : 'danger');
  }

  // The recommended landing square(s), drawn on top of the threat map.
  for (const col of bestCols) {
    const r = landingRow(board, col - 1);
    if (r === -1) continue;
    let kind = 'play';
    if (wouldWin(board, col - 1, player)) kind = 'win';
    else if (wouldWin(board, col - 1, opponent)) kind = 'block';
    // Overwrite any threat marker on the very square we recommend playing.
    const existing = cells.find(c => c.row === r && c.col === col - 1);
    if (existing) existing.kind = kind;
    else mark(r, col - 1, kind);
  }

  // Baseinverse: opponent forks the mover holds in check — a group with two
  // opponent discs and two directly-playable empties. Mark the open squares
  // 'controlled' (calm): once the opponent commits to one, the mover blocks the
  // other, since the two squares are always in different columns. Low priority —
  // never override a sharper mark (play/win/block/threat).
  const oppForks = baseinverseForks(board, opponent);
  for (const fork of oppForks) {
    for (const [r, c] of fork.empties) {
      if (!cells.some(cell => cell.row === r && cell.col === c)) mark(r, c, 'controlled');
    }
  }

  // Full threatening lines (three discs + the completing square) so the board
  // can show *why* a square matters — the heart of making blocks legible.
  const lines = [];
  for (const l of findThreatLines(board, opponent)) {
    const kind = controlledKeys.has(`${l.row}-${l.col}`) ? 'controlled' : 'danger';
    lines.push({kind, cells: l.cells});
  }
  for (const l of findThreatLines(board, player)) lines.push({kind: 'opportunity', cells: l.cells});
  // Ring each controlled fork so the two discs + two open squares read as a unit.
  for (const fork of oppForks) lines.push({kind: 'controlled', cells: fork.cells});

  return {concept, bestCol, bestCols, parity, cells, lines};
}
