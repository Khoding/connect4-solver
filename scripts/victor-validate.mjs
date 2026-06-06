/*
 * Copyright (C) 2026 Khodok — AGPL-3.0 (see app/learn/* headers).
 *
 * Tier C VICTOR — Phase 1 validation. See docs/tier-c-victor.md.
 *
 * Run: node scripts/victor-validate.mjs   (needs the node WASM build)
 *
 * Runs the combination solver (app/learn/victor.js) over solver-labelled
 * positions and measures, for the even controller (player 2):
 *   - SOUNDNESS (the Phase 1 milestone): whenever VICTOR finds a proof, the
 *     solver must agree player 2 is not losing. Target: ZERO false proofs.
 *   - COVERAGE (informative): of positions the solver says player 2 holds, how
 *     many can VICTOR prove with the current rules + disjoint-squares consistency.
 */

import {landingRow, wouldWin, dropInto, ROWS, COLS} from '../app/learn/threats.js';
import {solveVictor} from '../app/learn/victor.js';
import {analyze, oracleInfo} from './solver-oracle.mjs';

const N = Number(process.env.C4_VICTOR_N) || 500;
const MAX_PLIES = Number(process.env.C4_VICTOR_MAXPLIES) || 30;
const INITIAL_SEED = (Number(process.env.C4_VICTOR_SEED) || Date.now()) >>> 0;
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

  let holds = 0;
  let proven = 0; // VICTOR found a proof
  let provenAndHolds = 0;
  let coveredAmongHolds = 0;
  const falseProofs = [];
  let maxNodes = 0;

  for (let i = 0; i < N; i++) {
    const {moves, board} = randomLivePosition();
    const mover = (moves.length % 2) + 1;
    const scores = await analyze(moves);
    const best = bestPlayable(scores);
    const p2Holds = mover === 2 ? best >= 0 : best <= 0;

    const res = solveVictor(board, 2);
    maxNodes = Math.max(maxNodes, res.nodes);

    if (res.solved) {
      proven++;
      if (p2Holds) provenAndHolds++;
      else if (falseProofs.length < 8) falseProofs.push(moves || '(start)');
    }
    if (p2Holds) {
      holds++;
      if (res.solved) coveredAmongHolds++;
    }
  }

  const pct = (a, b) => (b ? ((100 * a) / b).toFixed(1) : '0.0') + '%';
  console.log(`Positions: ${N}  (seed ${INITIAL_SEED})`);
  console.log(`Player 2 at least draws (solver): ${holds}`);
  console.log(`VICTOR proofs found:              ${proven}`);
  console.log(`— confirmed by solver:            ${provenAndHolds}`);
  console.log(`— FALSE PROOFS:                   ${proven - provenAndHolds}  (target 0)`);
  console.log(`Coverage of holds:                ${coveredAmongHolds}/${holds} (${pct(coveredAmongHolds, holds)})`);
  console.log(`Max search nodes in a position:   ${maxNodes}`);
  if (falseProofs.length) {
    console.log('\nFALSE-PROOF positions (consistency gap):');
    for (const m of falseProofs) console.log('  - ' + m);
    process.exit(1);
  }
  console.log('\nSOUND ✅ — every VICTOR proof agrees with the solver.');
}

main().catch(e => {
  console.error('\nVICTOR validation could not run:\n' + e.message);
  process.exit(1);
});
