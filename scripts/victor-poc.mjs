/*
 * Copyright (C) 2026 Khodok — AGPL-3.0 (see app/learn/* headers).
 *
 * Tier C VICTOR — Phase 0 proof-of-concept / spike. See docs/tier-c-victor.md.
 *
 * Run: node scripts/victor-poc.mjs   (needs the node WASM build; see solver-oracle.mjs)
 *
 * Measures, against the perfect solver, how far our CURRENT three rules
 * (claimeven, baseinverse, aftereven) get at "solving all of player 1's threats"
 * for the even controller (player 2) — using NAIVE coverage (no consistency yet).
 *
 * It reports two things that decide the real build:
 *   1. Coverage — of positions the solver says player 2 can at least draw, how
 *      many can our rules cover every player-1 threat in?
 *   2. Soundness — when our rules DO cover everything, does the solver agree
 *      player 2 is not losing? "Covered but losing" = a false proof, i.e. proof
 *      that consistency (the omitted hard part) is what's actually needed.
 */

import {GROUPS, landingRow, wouldWin, dropInto, ROWS, COLS} from '../app/learn/threats.js';
import {controlledEvenSquares} from '../app/learn/claimeven.js';
import {playableSquares} from '../app/learn/baseinverse.js';
import {afterevenSolvedThreats} from '../app/learn/aftereven.js';
import {analyze, oracleInfo} from './solver-oracle.mjs';

const N = Number(process.env.C4_POC_N) || 500;
const MAX_PLIES = Number(process.env.C4_POC_MAXPLIES) || 30;
const INITIAL_SEED = (Number(process.env.C4_POC_SEED) || Date.now()) >>> 0;
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

const groupKey = g => g.map(([r, c]) => `${r},${c}`).sort().join(';');

/** Player-1 threats = every group with no player-2 disc (player 1 could complete it). */
function p1Threats(board) {
  return GROUPS.filter(g => g.every(([r, c]) => board[r][c] !== 2));
}

/** Which rule (if any) solves group g for the even controller — naive, no consistency. */
function solvedBy(g, controlled, playable, afterevenKeys) {
  if (g.some(([r, c]) => controlled.has(`${r}-${c}`))) return 'claimeven';
  if (g.filter(([r, c]) => playable.has(`${r}-${c}`)).length >= 2) return 'baseinverse';
  if (afterevenKeys.has(groupKey(g))) return 'aftereven';
  return null;
}

async function main() {
  const info = await oracleInfo();
  console.log(`Oracle: opening book ${info.bookLoaded ? 'loaded' : 'NOT loaded'}\n`);

  let holds = 0; // player 2 at least draws (solver)
  let coveredAmongHolds = 0;
  let covered = 0; // rules cover every threat
  let falseProofs = 0; // covered but player 2 is actually losing
  let gapSum = 0;
  let gapCount = 0;
  const usage = {claimeven: 0, baseinverse: 0, aftereven: 0};

  for (let i = 0; i < N; i++) {
    const {moves, board} = randomLivePosition();
    const mover = (moves.length % 2) + 1;
    const scores = await analyze(moves);
    const best = bestPlayable(scores);
    // Player 2 (even controller) at least draws?
    const p2Holds = mover === 2 ? best >= 0 : best <= 0;

    const controlled = controlledEvenSquares(board);
    const playable = new Set(playableSquares(board).map(s => `${s.row}-${s.col}`));
    const afterevenKeys = new Set(afterevenSolvedThreats(board, 2).map(t => groupKey(t.cells)));

    const threats = p1Threats(board);
    let unsolved = 0;
    for (const g of threats) {
      const by = solvedBy(g, controlled, playable, afterevenKeys);
      if (by) usage[by]++;
      else unsolved++;
    }
    const isCovered = unsolved === 0;

    if (p2Holds) {
      holds++;
      if (isCovered) coveredAmongHolds++;
      else {
        gapSum += unsolved;
        gapCount++;
      }
    }
    if (isCovered) {
      covered++;
      if (!p2Holds) falseProofs++;
    }
  }

  const pct = (a, b) => (b ? ((100 * a) / b).toFixed(1) : '0.0') + '%';
  console.log(`Positions: ${N}  (seed ${INITIAL_SEED})`);
  console.log(`Player 2 at least draws (solver): ${holds}`);
  console.log(`— covered by current rules:       ${coveredAmongHolds} (${pct(coveredAmongHolds, holds)} of holds)`);
  console.log(`— avg unsolved threats when not covered: ${gapCount ? (gapSum / gapCount).toFixed(1) : 0}`);
  console.log(`\nNaive coverage achieved overall:  ${covered}/${N}`);
  console.log(`FALSE PROOFS (covered but P2 losing): ${falseProofs}  ${falseProofs ? '← consistency is the missing piece' : ''}`);
  console.log(`\nThreats solved per rule (raw): claimeven ${usage.claimeven}, baseinverse ${usage.baseinverse}, aftereven ${usage.aftereven}`);
}

main().catch(e => {
  console.error('\nVICTOR PoC could not run:\n' + e.message);
  process.exit(1);
});
