/*
 * Copyright (C) 2026 Khodok — AGPL-3.0 (see app/learn/* headers).
 *
 * Learn-mode ORACLE harness — the solver-backed counterpart to the pure
 * geometry checks in validate-learn.mjs.
 *
 * Run: npm run test:learn:oracle   (needs a node-capable WASM build; see
 *      scripts/solver-oracle.mjs for the one-time rebuild instructions.)
 *
 * Where validate-learn.mjs proves properties verifiable from board geometry
 * alone, this harness feeds each position to the REAL solver and checks that
 * the Tier-A classifier never contradicts the solver's ground truth. It is the
 * scaffold Tier B (Allis rules) will extend: every new rule gets an assertion
 * here, validated against the solver over random positions.
 *
 * Baseline assertions (no Allis rule yet):
 *   - Plumbing self-test: the solved root favours the centre column (the known
 *     first-player win), so a broken/empty solver is caught before we blame
 *     the classifier.
 *   - Immediate win ⇒ solver win: every square the threat engine calls an
 *     immediate four is scored > 0 by the solver.
 *   - 'win'  ⇒ the move really wins, is solver-optimal, and is emitted whenever
 *             a win exists.
 *   - 'block'⇒ the recommended square denies the opponent's four, AND every
 *             non-blocking legal move is losing per the solver.
 *   - bestCol is always solver-optimal (guards the classifier's pickBest).
 *
 * Tune with env vars: C4_ORACLE_N (positions, default 300),
 *   C4_ORACLE_MAXPLIES (default 30), C4_ORACLE_SEED (default time-based).
 */

import {
  findThreats,
  wouldWin,
  dropInto,
  landingRow,
  ROWS,
  COLS,
} from '../app/learn/threats.js';
import {classifyHint} from '../app/learn/classifier.js';
import {analyze, oracleInfo} from './solver-oracle.mjs';

const N = Number(process.env.C4_ORACLE_N) || 300;
const MAX_PLIES = Number(process.env.C4_ORACLE_MAXPLIES) || 30;

// ── Tiny seedable RNG so failures are reproducible (mulberry32). ──
const INITIAL_SEED = (Number(process.env.C4_ORACLE_SEED) || Date.now()) >>> 0;
let seed = INITIAL_SEED;
function rand() {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function pick(arr) {
  return arr[Math.floor(rand() * arr.length)];
}

let passed = 0;
let failed = 0;
const fails = [];
function check(name, cond, ctx) {
  if (cond) passed++;
  else {
    failed++;
    fails.push(ctx ? `${name}  [${ctx}]` : name);
  }
}

const emptyBoard = () => Array.from({length: ROWS}, () => Array(COLS).fill(0));

/** Generate a random, still-live position (nobody has won) as a move string. */
function randomLivePosition() {
  let b = emptyBoard();
  let moves = '';
  const target = 2 + Math.floor(rand() * (MAX_PLIES - 1));
  for (let i = 0; i < target; i++) {
    const player = (i % 2) + 1;
    const playable = [];
    for (let c = 0; c < COLS; c++) if (landingRow(b, c) !== -1) playable.push(c);
    if (!playable.length) break;
    // Prefer non-winning moves so the board never already contains a four.
    const nonWin = playable.filter(c => !wouldWin(b, c, player));
    if (!nonWin.length) break; // every move wins — stop just shy of a decided board
    const c = pick(nonWin);
    b = dropInto(b, c, player);
    moves += String(c + 1);
  }
  return {moves, board: b};
}

/** Max score over playable columns (ignores the -1000 unplayable sentinel). */
function bestPlayable(scores) {
  let best = -Infinity;
  for (let i = 0; i < COLS; i++) if (scores[i] !== -1000 && scores[i] > best) best = scores[i];
  return best;
}

async function main() {
  const info = await oracleInfo();
  console.log(`Oracle: opening book ${info.bookLoaded ? 'loaded' : 'NOT loaded (slower)'}`);

  // ── Plumbing self-test: the empty board is a first-player win via the centre.
  {
    const root = await analyze('');
    const best = bestPlayable(root);
    check('self-test: root centre column is best', root[3] === best, `scores=${root}`);
    check('self-test: root is a first-player win', best > 0, `scores=${root}`);
  }

  // ── Classifier-vs-solver cross-check over random positions. ──
  for (let iter = 0; iter < N; iter++) {
    const {moves, board} = randomLivePosition();
    const player = (moves.length % 2) + 1; // 1 = first mover, 2 = second
    const opp = player === 1 ? 2 : 1;

    const scores = await analyze(moves);
    const best = bestPlayable(scores);
    const ctx = `pos=${moves || '(start)'}`;

    // 1. Every geometric immediate win must be a solver win.
    for (let c = 0; c < COLS; c++) {
      if (wouldWin(board, c, player)) {
        check('immediate win ⇒ solver scores it > 0', scores[c] > 0, `${ctx} col=${c + 1}`);
      }
    }

    const hint = classifyHint(board, scores, player);
    if (!hint) continue;
    const bestIdx = hint.bestCol - 1;

    // 2. bestCol is always solver-optimal (pickBest guard).
    check('bestCol is solver-optimal', scores[bestIdx] === best, `${ctx} bestCol=${hint.bestCol}`);

    // 3. 'win' is correct and complete.
    const moverHasWin = [...Array(COLS).keys()].some(c => wouldWin(board, c, player));
    if (moverHasWin) {
      check('a win exists ⇒ concept is win', hint.concept === 'win', ctx);
    }
    if (hint.concept === 'win') {
      check('win ⇒ bestCol completes four', wouldWin(board, bestIdx, player), `${ctx} bestCol=${hint.bestCol}`);
      check('win ⇒ solver agrees it wins', scores[bestIdx] > 0, `${ctx} bestCol=${hint.bestCol}`);
    }

    // 4. 'block' is correct: it denies an opponent four, and ignoring the
    //    threat loses per the solver.
    if (hint.concept === 'block') {
      check('block ⇒ bestCol denies opponent four', wouldWin(board, bestIdx, opp), `${ctx} bestCol=${hint.bestCol}`);
      for (let c = 0; c < COLS; c++) {
        if (landingRow(board, c) === -1) continue; // unplayable
        const after = dropInto(board, c, player);
        const stillThreatened = [...Array(COLS).keys()].some(g => wouldWin(after, g, opp));
        if (stillThreatened) {
          // Leaving an opponent four on the board: the solver must score it lost.
          check('block ⇒ non-blocking move is losing', scores[c] < 0, `${ctx} col=${c + 1}`);
        }
      }
    }

    // 5. Overlay markers stay in bounds (cheap solver-independent guard kept here too).
    for (const cell of hint.cells) {
      const inBounds = cell.row >= 0 && cell.row < ROWS && cell.col >= 0 && cell.col < COLS;
      if (!inBounds) {
        check('overlay cell in bounds', false, ctx);
        break;
      }
    }
  }

  // ── Report ──
  console.log(`\nLearn-mode ORACLE validation: ${passed} passed, ${failed} failed (seed ${INITIAL_SEED})`);
  if (failed) {
    console.log('FAILURES:');
    for (const f of [...new Set(fails)].slice(0, 40)) console.log('  - ' + f);
    process.exit(1);
  }
  console.log('Classifier agrees with the solver on every position ✅');
}

main().catch(e => {
  console.error('\nOracle harness could not run:\n' + e.message);
  process.exit(1);
});
