/*
 * Copyright (C) 2026 Khodok — AGPL-3.0 (see app/learn/* headers).
 *
 * Tier C VICTOR — player-2 (Black) WIN prover validation. See docs/tier-c-victor.md.
 *
 * Run: node scripts/victor-black-validate.mjs   (needs the node WASM build)
 *
 * Runs solveBlackWin (app/learn/victor.js) over solver-labelled positions and
 * measures, for Black (player 2):
 *   - SOUNDNESS (the milestone): whenever the prover finds a win, the solver must
 *     agree Black wins. Target: ZERO false proofs. The prover keys off Allis's
 *     "aftereven in the drawing cover ⇒ Black wins" result (§9.2).
 *   - COVERAGE (informative): of positions the solver says Black wins, how many
 *     can the prover prove.
 */

import {landingRow, wouldWin, dropInto, ROWS, COLS} from '../app/learn/threats.js';
import {solveBlackWin} from '../app/learn/victor.js';
import {analyze, oracleInfo} from './solver-oracle.mjs';

const N = Number(process.env.C4_BLACK_N) || 3000;
const MAX_PLIES = Number(process.env.C4_BLACK_MAXPLIES) || 30;
const INITIAL_SEED = (Number(process.env.C4_BLACK_SEED) || Date.now()) >>> 0;
let seed = INITIAL_SEED;
function rand() {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = arr => arr[Math.floor(rand() * arr.length)];
const emptyBoard = () => Array.from({length: ROWS}, () => Array(COLS).fill(0));

function randomLivePosition() {
  let b = emptyBoard();
  let moves = '';
  const target = 2 + Math.floor(rand() * (MAX_PLIES - 1));
  for (let i = 0; i < target; i++) {
    const player = (i % 2) + 1;
    const playable = [];
    for (let c = 0; c < COLS; c++) if (landingRow(b, c) !== -1) playable.push(c);
    if (!playable.length) break;
    const nonWin = playable.filter(c => !wouldWin(b, c, player));
    if (!nonWin.length) break;
    const c = pick(nonWin);
    b = dropInto(b, c, player);
    moves += String(c + 1);
  }
  return {moves, board: b};
}

function bestPlayable(scores) {
  let best = -Infinity;
  for (let i = 0; i < COLS; i++) if (scores[i] !== -1000 && scores[i] > best) best = scores[i];
  return best;
}

async function main() {
  const info = await oracleInfo();
  console.log(`Oracle: opening book ${info.bookLoaded ? 'loaded' : 'NOT loaded'}\n`);

  let blackWins = 0;
  let proven = 0;
  let provenAndWins = 0;
  let coveredAmongWins = 0;
  const falseProofs = [];
  let maxNodes = 0;
  let immediate = 0;

  for (let i = 0; i < N; i++) {
    const {moves, board} = randomLivePosition();
    const mover = (moves.length % 2) + 1;
    const scores = await analyze(moves);
    const best = bestPlayable(scores);
    // Black (player 2) wins with best play? best is from the mover's perspective.
    const blackWin = mover === 2 ? best > 0 : best < 0;

    const res = solveBlackWin(board);
    maxNodes = Math.max(maxNodes, res.nodes);

    if (res.solved) {
      proven++;
      if (res.kind === 'immediate') immediate++;
      if (blackWin) provenAndWins++;
      else if (falseProofs.length < 8) falseProofs.push((moves || '(start)') + ` [${res.kind}]`);
    }
    if (blackWin) {
      blackWins++;
      if (res.solved) coveredAmongWins++;
    }
  }

  const pct = (a, b) => (b ? ((100 * a) / b).toFixed(1) : '0.0') + '%';
  console.log(`Positions: ${N}  (seed ${INITIAL_SEED})`);
  console.log(`Black wins (solver):              ${blackWins}`);
  console.log(`Win proofs found:                 ${proven}  (${immediate} immediate)`);
  console.log(`— confirmed by solver:            ${provenAndWins}`);
  console.log(`— FALSE PROOFS:                   ${proven - provenAndWins}  (target 0)`);
  console.log(`Coverage of wins:                 ${coveredAmongWins}/${blackWins} (${pct(coveredAmongWins, blackWins)})`);
  console.log(`Max search nodes in a position:   ${maxNodes}`);
  if (falseProofs.length) {
    console.log('\nFALSE-PROOF positions:');
    for (const m of falseProofs) console.log('  - ' + m);
    process.exit(1);
  }
  console.log('\nSOUND ✅ — every Black-win proof agrees with the solver.');
}

main().catch(e => {
  console.error('\nBlack-win validation could not run:\n' + e.message);
  process.exit(1);
});
