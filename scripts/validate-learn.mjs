/*
 * Copyright (C) 2026 Khodok — AGPL-3.0 (see src/learn/*.js headers).
 *
 * Dependency-free validation harness for the Learn-mode analysis (Tier A).
 *
 * Run: node scripts/validate-learn.mjs
 *
 * This is the foundation the later tiers grow on. Right now it checks the
 * properties we can verify *without* the solver:
 *   - the threat engine only reports legal, completing, correctly-parity'd squares
 *   - win / block / *_threat labels match the board reality
 * A future step plugs the WASM solver in as an oracle (ENVIRONMENT=node build or
 * a headless-browser runner) to validate draw/win *proofs* once Allis rules land.
 */

import {
  GROUPS,
  findThreats,
  findThreatLines,
  wouldWin,
  dropInto,
  landingRow,
  rowParity,
  ROWS,
  COLS,
} from '../app/learn/threats.js';
import {classifyHint} from '../app/learn/classifier.js';

let passed = 0;
let failed = 0;
const fails = [];
function check(name, cond) {
  if (cond) passed++;
  else {
    failed++;
    fails.push(name);
  }
}

/** Independent re-check that placing `player` at (r,c) makes a four. */
function squareCompletesFour(board, r, c, player) {
  const test = board.map(row => row.slice());
  test[r][c] = player;
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (const [dr, dc] of dirs) {
    let count = 1;
    for (let s = -1; s <= 1; s += 2) {
      for (let k = 1; k < 4; k++) {
        const nr = r + dr * k * s;
        const nc = c + dc * k * s;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) break;
        if (test[nr][nc] !== player) break;
        count++;
      }
    }
    if (count >= 4) return true;
  }
  return false;
}

// ── 1. Structural ─────────────────────────────────────────────
check('group count is 69', GROUPS.length === 69);
check('rowParity bottom row (r=0) is odd', rowParity(0) === 'odd');
check('rowParity second row (r=1) is even', rowParity(1) === 'even');

// ── 2. Hand-built threats ─────────────────────────────────────
{
  // P1 has three in a row on the bottom (cols 1,2,3), gap at col 4 -> threat at (0,3) odd.
  const b = Array.from({length: ROWS}, () => Array.from({length: COLS}, () => 0));
  b[0][0] = 1;
  b[0][1] = 1;
  b[0][2] = 1;
  const t = findThreats(b, 1);
  const sq = t.find(s => s.row === 0 && s.col === 3);
  check('open-three reports the completing square', !!sq);
  check('that square is an odd threat', sq && sq.parity === 'odd');
  // Left end is off-board (col -1), so only the right gap (col 4) is a threat.
  check('only the single open end is a threat', t.length === 1);
}
{
  // Vertical three for P2 in col 4 (rows 0,1,2) -> threat at (3,4) even.
  const b = Array.from({length: ROWS}, () => Array.from({length: COLS}, () => 0));
  b[0][3] = 2;
  b[1][3] = 2;
  b[2][3] = 2;
  const t = findThreats(b, 2);
  const sq = t.find(s => s.row === 3 && s.col === 3);
  check('vertical-three reports square above', !!sq);
  check('that square is an even threat', sq && sq.parity === 'even');
}

// ── 3. Property tests over random legal positions ─────────────
function randomBoard(plies) {
  const b = Array.from({length: ROWS}, () => Array.from({length: COLS}, () => 0));
  for (let i = 0; i < plies; i++) {
    const open = [];
    for (let c = 0; c < COLS; c++) if (landingRow(b, c) !== -1) open.push(c);
    if (!open.length) break;
    const c = open[Math.floor(Math.random() * open.length)];
    const r = landingRow(b, c);
    b[r][c] = (i % 2) + 1;
    // stop early if someone already won, to keep positions "live"
    if (wouldWinAt(b, r, c, b[r][c])) {
      b[r][c] = 0;
      break;
    }
  }
  return b;
}
function wouldWinAt(board, r, c, p) {
  return squareCompletesFour(
    board.map((row, ri) => row.map((v, ci) => (ri === r && ci === c ? 0 : v))),
    r,
    c,
    p,
  );
}

for (let iter = 0; iter < 4000; iter++) {
  const b = randomBoard(2 + Math.floor(Math.random() * 30));
  for (const player of [1, 2]) {
    const opp = player === 1 ? 2 : 1;
    for (const t of findThreats(b, player)) {
      if (b[t.row][t.col] !== 0) {
        check('threat square is empty', false);
        break;
      }
      if (!squareCompletesFour(b, t.row, t.col, player)) {
        check('threat square actually completes four', false);
        break;
      }
      if (t.parity !== rowParity(t.row)) {
        check('threat parity matches row', false);
        break;
      }
    }
    // Threat lines: each is exactly 3 own + 1 empty (= the completing square).
    for (const line of findThreatLines(b, player)) {
      if (line.cells.length !== 4) {
        check('threat line has 4 cells', false);
        break;
      }
      let mine = 0;
      let empty = 0;
      let theirs = 0;
      for (const [r, c] of line.cells) {
        const v = b[r][c];
        if (v === player) mine++;
        else if (v === opp) theirs++;
        else empty++;
      }
      const squareIsEmptyMember =
        b[line.row][line.col] === 0 &&
        line.cells.some(([r, c]) => r === line.row && c === line.col);
      if (!(mine === 3 && empty === 1 && theirs === 0 && squareIsEmptyMember)) {
        check('threat line is 3 own + 1 empty completing square', false);
        break;
      }
    }
  }

  // classifier label sanity using synthetic scores that force a known best col.
  const openCols = [];
  for (let c = 0; c < COLS; c++) if (landingRow(b, c) !== -1) openCols.push(c + 1);
  if (openCols.length) {
    // Make each open column "best" in turn and check label invariants.
    for (const player of [1, 2]) {
      for (const forced of openCols) {
        const scores = Array(7).fill(-1000);
        for (const c of openCols) scores[c - 1] = c === forced ? 5 : 0;
        const hint = classifyHint(b, scores, player);
        if (!hint) continue;
        if (hint.concept === 'win') {
          check('win label => bestCol completes four', wouldWin(b, hint.bestCol - 1, player));
        }
        if (hint.concept === 'block') {
          const opp = player === 1 ? 2 : 1;
          check('block label => opponent threatened at bestCol', wouldWin(b, hint.bestCol - 1, opp));
        }
        if (hint.concept === 'odd_threat' || hint.concept === 'even_threat') {
          const next = dropInto(b, hint.bestCol - 1, player);
          const before = findThreats(b, player).map(t => t.key);
          const created = next
            ? findThreats(next, player).filter(t => !before.includes(t.key))
            : [];
          check('threat label => the move creates a new threat', created.length > 0);
          check(
            'threat label parity matches an actually-created threat',
            created.some(t => (hint.concept === 'odd_threat' ? 'odd' : 'even') === t.parity),
          );
        }
        // overlay never marks an out-of-board or occupied-by-the-mark cell incorrectly
        for (const cell of hint.cells) {
          const inBounds =
            cell.row >= 0 && cell.row < ROWS && cell.col >= 0 && cell.col < COLS;
          if (!inBounds) {
            check('overlay cell in bounds', false);
            break;
          }
        }
      }
    }
  }
}

// ── Report ────────────────────────────────────────────────────
console.log(`\nLearn-mode validation: ${passed} passed, ${failed} failed`);
if (failed) {
  console.log('FAILURES:');
  for (const f of new Set(fails)) console.log('  - ' + f);
  process.exit(1);
}
console.log('All Tier-A invariants hold ✅');
