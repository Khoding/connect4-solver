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
 * Curated teaching positions for the learn guide (/guide). Each one is a real
 * position whose game-theoretical outcome is known (checked against the perfect
 * solver) and whose VICTOR pairing closes a proof — so the guide's mini-board can
 * render the plan directly from the rules, no WASM round-trip needed.
 *
 * `moves` are 1-indexed column numbers, played alternately starting with player 1.
 * `outcome` selects the prover (`buildPairingForOutcome`). `concept` is the i18n
 * key under `guide.examples.*` for the caption, and groups the example with the
 * narrative section that introduces its idea.
 */

import {ROWS, COLS, dropInto} from './threats.js';

/** Build a board (board[r][c], r from bottom) from a 1-indexed column string. */
export function boardFromMoves(moves) {
  let b = Array.from({length: ROWS}, () => Array(COLS).fill(0));
  [...moves].forEach((ch, i) => {
    b = dropInto(b, Number(ch) - 1, (i % 2) + 1);
  });
  return b;
}

/** Whose move it is after the given sequence (1 or 2). */
export function moverAfter(moves) {
  return (moves.length % 2) + 1;
}

export const EXAMPLES = [
  // ── First player forcing the win (odd threats + zugzwang) ──
  {id: 'win-immediate', moves: '554735', outcome: 'whiteWin', concept: 'immediate'},
  {id: 'win-odd-baseinverse', moves: '555357362', outcome: 'whiteWin', concept: 'oddThreat'},
  {id: 'win-odd-zugzwang', moves: '5242534227', outcome: 'whiteWin', concept: 'zugzwang'},
  {id: 'win-odd-aftereven', moves: '334555666333', outcome: 'whiteWin', concept: 'afterevenWin'},

  // ── Second player forcing the win (an aftereven four) ──
  {id: 'win-black-aftereven', moves: '62651533322', outcome: 'blackWin', concept: 'blackAftereven'},

  // ── Second player holding at least the draw (the pairing rules) ──
  {id: 'draw-claimeven', moves: '7464144674', outcome: 'draw', concept: 'claimeven'},
  {id: 'draw-before', moves: '541434', outcome: 'draw', concept: 'before'},
  {id: 'draw-inverse', moves: '57741464', outcome: 'draw', concept: 'inverse'},
  {id: 'draw-baseclaim', moves: '33637573375', outcome: 'draw', concept: 'baseclaim'},
  {id: 'draw-aftereven', moves: '1444342', outcome: 'draw', concept: 'aftereven'},
];
