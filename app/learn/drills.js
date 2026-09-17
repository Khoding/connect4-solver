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
 * Exercise generator and grader for practice mode (/practice).
 *
 * Nothing here is curated. A drill is found by walking a plausible game and
 * asking the two engines the app already owns, at every ply, whether the
 * position in front of them teaches the requested idea:
 *
 *   - the WASM solver scores all seven columns, which fixes the right answer
 *     and how wrong every other answer is;
 *   - classifyHint (Tier A) names the recommended move, which is what makes a
 *     position "a blocking exercise" rather than just a position.
 *
 * Because the walk plays mostly-good moves with an occasional slip, the games
 * look human and the blunders that create block-and-punish positions turn up on
 * their own. Rerolling runs the same search again, so the learner meets the
 * same idea wearing a different board.
 *
 * `analyze` is injected rather than imported so this module stays free of the
 * browser solver plumbing and can be exercised from node (scripts/validate-
 * drills.mjs).
 */

import {classifyHint, nameMove} from './classifier.js';
import {boardFromMoves, moverAfter} from './examples.js';
import {wouldWin, dropInto, landingRow, rowParity, favouredParity, GROUPS, COLS} from './threats.js';
import {classifyPly} from '../utils/recap.js';

/** Concepts a learner can drill, in teaching order. 'any' takes what comes. */
export const DRILL_CONCEPTS = [
  'any',
  'win',
  'block',
  'odd_threat',
  'even_threat',
  'claimeven',
  'develop',
];

/** A column the solver marks unplayable. */
const UNPLAYABLE = -1000;

function playableCols(scores) {
  const cols = [];
  for (let i = 0; i < COLS; i++) if (scores[i] !== UNPLAYABLE) cols.push(i);
  return cols;
}

/**
 * Is this position worth asking about? A position teaches nothing when every
 * move is equally fine, when the answer is a coin flip between four columns, or
 * when the board is so full that there is no real choice left.
 */
function isTeachable(scores, hint) {
  const playable = playableCols(scores);
  if (playable.length < 3) return false;
  if (hint.bestCols.length > 2) return false;

  const values = playable.map(i => scores[i]);
  const best = Math.max(...values);
  const worst = Math.min(...values);
  // Either a wide spread, or a move that throws away a non-loss: both give the
  // learner something they can get wrong and understand afterwards.
  return best - worst >= 4 || (best >= 0 && worst < 0);
}

/**
 * Choose the next move of the walk. Mostly best play, sometimes a merely
 * reasonable move, now and then a genuine slip — the slips are what produce
 * positions with something to punish.
 */
function pickContinuation(scores, rng) {
  const playable = playableCols(scores);
  if (!playable.length) return null;
  const best = Math.max(...playable.map(i => scores[i]));

  const roll = rng();
  let pool;
  if (roll < 0.55) pool = playable.filter(i => scores[i] === best);
  else if (roll < 0.9) pool = playable.filter(i => best - scores[i] <= 6);
  else pool = playable;
  if (!pool.length) pool = playable;

  return pool[Math.floor(rng() * pool.length)] + 1;
}

/**
 * Search for a position whose best move illustrates `target`.
 *
 * @param {string} target - one of DRILL_CONCEPTS ('any' accepts the first
 *   teachable position found)
 * @param {object} opts
 * @param {(moves: string) => Promise<number[]>} opts.analyze - solver scores
 * @param {number} [opts.budget] - max solver calls before giving up
 * @param {number} [opts.minPly] - shortest position to offer
 * @param {number} [opts.maxPly] - restart the walk past this depth
 * @param {() => number} [opts.rng]
 * @param {() => boolean} [opts.cancelled] - abort hook for component teardown
 * @returns {Promise<null | {moves, board, player, scores, hint, bestCols, bestScore}>}
 */
export async function generateDrill(target, opts) {
  const {analyze, budget = 160, minPly = 6, maxPly = 32, rng = Math.random, cancelled} = opts;

  let moves = '';
  for (let calls = 0; calls < budget; calls++) {
    if (cancelled?.()) return null;

    const board = boardFromMoves(moves);
    const player = moverAfter(moves);
    const scores = await analyze(moves);

    if (moves.length >= minPly) {
      const hint = classifyHint(board, scores, player);
      // Most legal moves are developing moves, so 'any' would serve them almost
      // every time. Hold out for a position with a sharper name first, and only
      // settle for a quiet one late in the budget.
      const settling = calls > budget * 0.6;
      const wanted =
        target === 'any' ? settling || hint?.concept !== 'develop' : hint?.concept === target;

      if (hint && wanted && isTeachable(scores, hint)) {
        const bestScore = Math.max(...playableCols(scores).map(i => scores[i]));
        // `concept` is the resolved idea even when the caller asked for 'any',
        // so the prompt can name what this position is about.
        return {
          moves,
          board,
          player,
          scores,
          hint,
          concept: hint.concept,
          bestCols: hint.bestCols,
          bestScore,
        };
      }
    }

    const next = pickContinuation(scores, rng);
    // Dead end, a finished game, or deep enough that the endgame has no room
    // left to teach in: start another game rather than grinding this one out.
    if (next === null || wouldWin(board, next - 1, player) || moves.length + 1 >= maxPly) {
      moves = '';
      continue;
    }
    moves += String(next);
  }

  return null;
}

/**
 * How the played score compares to the best one, as a key the UI translates.
 * `best` is always >= `played`, so only downgrades are reachable.
 */
function outcomeShift(played, best) {
  const sign = v => (v > 0 ? 'win' : v < 0 ? 'loss' : 'draw');
  const from = sign(best);
  const to = sign(played);
  if (from !== to) return `${from}_to_${to}`;
  if (played === best) return 'same';
  // Same verdict, different speed: a slower win, or a faster defeat. Two draws
  // always score 0, so there is no third case.
  return from === 'win' ? 'slower' : 'sooner';
}

/**
 * Grade one answer against the drill's solver scores.
 *
 * Both the played move and the recommended move are named through nameMove, so
 * the feedback can contrast them in the same vocabulary the Learn card uses.
 *
 * @returns {null | {col, played, bestScore, delta, tier, correct, playedConcept,
 *   bestConcept, bestCol, shift}}
 */
export function gradeAnswer(drill, col) {
  if (!drill) return null;
  const idx = col - 1;
  const played = drill.scores[idx];
  if (played === undefined || played === UNPLAYABLE) return null;

  return {
    col,
    played,
    bestScore: drill.bestScore,
    delta: drill.bestScore - played,
    tier: classifyPly(played, drill.bestScore),
    correct: drill.bestCols.includes(col),
    playedConcept: nameMove(drill.board, idx, drill.player).concept,
    bestConcept: drill.hint.concept,
    bestCol: drill.bestCols[0],
    shift: outcomeShift(played, drill.bestScore),
  };
}

/**
 * Measure a quiet move the way the guide's developing-move habits do.
 *
 * "A developing move" covers most of the board most of the time, so naming two
 * different columns that way says nothing about why one beats the other. These
 * are the two facts a human can check over a real board: how many fours the
 * move joins that the opponent has not touched, and whether it lands on the
 * mover's own parity row.
 *
 * @returns {null | {lines: number, onParity: boolean, row: number}}
 */
export function quietProfile(board, col, player) {
  const row = landingRow(board, col);
  if (row === -1) return null;

  const opponent = player === 1 ? 2 : 1;
  let lines = 0;
  for (const group of GROUPS) {
    if (!group.some(([r, c]) => r === row && c === col)) continue;
    if (group.some(([r, c]) => board[r][c] === opponent)) continue;
    lines++;
  }

  return {lines, onParity: rowParity(row) === favouredParity(player), row};
}

/**
 * What the opponent plays to punish a move, and what that reply is called.
 *
 * Rule names alone cannot separate two quiet moves: in an early position the
 * learner's column and the solver's column are both "a developing move", and
 * saying so twice explains nothing. The refutation is the missing half — the
 * concrete reply that makes the difference, straight from the solver.
 *
 * Costs one extra solver call, so the caller decides when to pay it.
 *
 * @param {object} drill
 * @param {number} col - the 1-indexed column the learner played
 * @param {(moves: string) => Promise<number[]>} analyze
 * @returns {Promise<null | {col: number, cols: number[], concept: string}>}
 */
export async function explainRefutation(drill, col, analyze) {
  if (!drill || drill.bestCols.includes(col)) return null;

  const idx = col - 1;
  if (drill.scores[idx] === undefined || drill.scores[idx] === UNPLAYABLE) return null;
  // A move that wins on the spot has no refutation, whatever else is wrong with it.
  if (wouldWin(drill.board, idx, drill.player)) return null;

  const after = dropInto(drill.board, idx, drill.player);
  if (!after) return null;

  const scores = await analyze(drill.moves + String(col));
  const playable = playableCols(scores);
  if (!playable.length) return null;

  const best = Math.max(...playable.map(i => scores[i]));
  const cols = playable.filter(i => scores[i] === best).map(i => i + 1);
  const opponent = drill.player === 1 ? 2 : 1;

  // When taking the square the learner should have taken is among the best
  // replies, name that one: "they take it themselves" is the sharpest possible
  // statement of what the missed move was worth.
  const reply = cols.find(c => drill.bestCols.includes(c)) ?? cols[0];

  return {
    col: reply,
    cols,
    takesBest: drill.bestCols.includes(reply),
    concept: nameMove(after, reply - 1, opponent).concept,
  };
}
