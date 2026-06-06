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
 * Tier B assertions:
 *   - claimeven (Allis): when the classifier names a move 'claimeven' it is a
 *     real second-player even-square claim and solver-optimal; and the claimeven
 *     control mechanism holds against the solver — activating a controlled even
 *     threat (player 1 fills the odd square below) turns it into an immediate
 *     threat the second player can always block by taking the even square above.
 *   - baseinverse (Allis): for a fork (two of the mover's discs in a group whose
 *     two empties are both directly playable), filling one empty makes the other
 *     an immediate threat the opponent must block — and always can, since the two
 *     squares lie in different columns. Validated against the solver.
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
import {claimevenControlledThreats, isClaimevenMove} from '../app/learn/claimeven.js';
import {baseinverseForks} from '../app/learn/baseinverse.js';
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
let claimevenActivations = 0; // how many times the control mechanism was exercised
let baseinverseActivations = 0;
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

    // 5. claimeven (Tier B): if named, it really is a second-player even-square
    //    claim above a player-1 disc, and it is solver-optimal.
    if (hint.concept === 'claimeven') {
      check('claimeven ⇒ second player to move', player === 2, ctx);
      check(
        'claimeven ⇒ even square claimed above a player-1 disc',
        isClaimevenMove(board, bestIdx, player),
        `${ctx} bestCol=${hint.bestCol}`,
      );
      check('claimeven ⇒ solver-optimal', scores[bestIdx] === best, `${ctx} bestCol=${hint.bestCol}`);
    }

    // 6. claimeven control mechanism, validated against the solver. When player 1
    //    is to move and holds a claimeven-controlled even threat whose odd square
    //    below is playable right now, filling that odd square activates the
    //    threat — and the solver must then show it is a forced block the second
    //    player can always answer by taking the even square above.
    if (player === 1) {
      for (const t of claimevenControlledThreats(board)) {
        const aRow = t.row - 1; // the odd square directly below the even threat
        if (landingRow(board, t.col) !== aRow) continue; // must be playable now
        const afterA = dropInto(board, t.col, 1); // player 1 fills the odd square
        if (!wouldWin(afterA, t.col, 1)) {
          check('claimeven: filling the odd square activates the even threat', false, `${ctx} col=${t.col + 1}`);
          continue;
        }
        claimevenActivations++;
        const scores2 = await analyze(moves + String(t.col + 1)); // second player to move
        for (let g = 0; g < COLS; g++) {
          if (landingRow(afterA, g) === -1) continue;
          if (wouldWin(afterA, g, 2)) continue; // P2 wins outright — game ends, threat moot
          const afterG = dropInto(afterA, g, 2);
          const stillWins = [...Array(COLS).keys()].some(k => wouldWin(afterG, k, 1));
          if (stillWins) {
            check('claimeven: ignoring the activated even threat loses', scores2[g] < 0, `${ctx} via col=${t.col + 1}, ignore=${g + 1}`);
          }
        }
      }
    }

    // 6b. baseinverse control mechanism, validated against the solver. For a
    //     fork the mover holds (two discs + two playable empties), filling one
    //     empty makes the other an immediate threat the opponent must block —
    //     and always can, the two squares being in different columns.
    for (const fork of baseinverseForks(board, player)) {
      for (const [pr, pc] of fork.empties) {
        if (landingRow(board, pc) !== pr) continue; // playable now
        if (wouldWin(board, pc, player)) continue; // activation wins elsewhere — not a quiet fork play
        const afterP = dropInto(board, pc, player);
        const other = fork.empties.find(e => !(e[0] === pr && e[1] === pc));
        if (!other || !wouldWin(afterP, other[1], player)) {
          check('baseinverse: filling one fork square makes the other an immediate threat', false, `${ctx} fill=${pc + 1}`);
          continue;
        }
        baseinverseActivations++;
        const scores2 = await analyze(moves + String(pc + 1)); // opponent to move
        for (let g = 0; g < COLS; g++) {
          if (landingRow(afterP, g) === -1) continue;
          if (wouldWin(afterP, g, opp)) continue; // opponent wins outright — threat moot
          const afterG = dropInto(afterP, g, opp);
          const stillWins = [...Array(COLS).keys()].some(k => wouldWin(afterG, k, player));
          if (stillWins) {
            check('baseinverse: opponent ignoring the activated threat loses', scores2[g] < 0, `${ctx} fill=${pc + 1}, ignore=${g + 1}`);
          }
        }
      }
    }

    // 7. Overlay markers stay in bounds (cheap solver-independent guard kept here too).
    for (const cell of hint.cells) {
      const inBounds = cell.row >= 0 && cell.row < ROWS && cell.col >= 0 && cell.col < COLS;
      if (!inBounds) {
        check('overlay cell in bounds', false, ctx);
        break;
      }
    }
  }

  // ── Report ──
  console.log(`\nControl activations checked against solver — claimeven: ${claimevenActivations}, baseinverse: ${baseinverseActivations}`);
  console.log(`Learn-mode ORACLE validation: ${passed} passed, ${failed} failed (seed ${INITIAL_SEED})`);
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
