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
import {
  CLAIMEVEN_PAIRS,
  isEvenRow,
  availableClaimevens,
  claimevenControlledThreats,
  isClaimevenMove,
} from '../app/learn/claimeven.js';
import {playableSquares, baseinverseForks} from '../app/learn/baseinverse.js';
import {afterevenGroups, threatsSolvedByAftereven} from '../app/learn/aftereven.js';

const sameGroup = (a, b) =>
  a.map(([r, c]) => `${r},${c}`).sort().join(';') === b.map(([r, c]) => `${r},${c}`).sort().join(';');

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

// ── 4. Claimeven (Tier B) structural ──────────────────────────
const emptyBoard = () => Array.from({length: ROWS}, () => Array.from({length: COLS}, () => 0));

check('claimeven: 21 pairs (3 per column)', CLAIMEVEN_PAIRS.length === 21);
for (const p of CLAIMEVEN_PAIRS) {
  const [lr, lc] = p.lower;
  const [ur, uc] = p.upper;
  check('claimeven: lower square is odd-parity', rowParity(lr) === 'odd');
  check('claimeven: upper square is even-parity', rowParity(ur) === 'even');
  check('claimeven: upper sits directly above lower', uc === lc && ur === lr + 1);
}

// On an empty board every pair is available; isEvenRow agrees with rowParity.
check('claimeven: empty board has 21 available pairs', availableClaimevens(emptyBoard()).length === 21);
for (let r = 0; r < ROWS; r++) check('claimeven: isEvenRow matches rowParity', isEvenRow(r) === (rowParity(r) === 'even'));

{
  // P1 has a horizontal even-row threat at (1,3); the square below (0,3) is empty,
  // so the claimeven pair at column 3 is intact and the threat is controlled.
  const b = emptyBoard();
  b[0][0] = 2; b[0][1] = 1; b[0][2] = 2; // fillers under the P1 row (no four)
  b[1][0] = 1; b[1][1] = 1; b[1][2] = 1; // P1 three-in-a-row on row 2 (even)
  const controlled = claimevenControlledThreats(b);
  check('claimeven: intact pair makes the even threat controlled', controlled.some(t => t.row === 1 && t.col === 3));

  // Fill the odd square below: the pair breaks, the even square becomes playable,
  // and the threat is no longer claimeven-controlled.
  b[0][3] = 1;
  const controlled2 = claimevenControlledThreats(b);
  check('claimeven: broken pair leaves the threat uncontrolled', !controlled2.some(t => t.row === 1 && t.col === 3));
}

{
  // isClaimevenMove: P2 claiming the even square directly above a P1 disc.
  const b = emptyBoard();
  b[0][0] = 1; // P1 on the odd square of column 1
  b[0][1] = 2; // P2 on the odd square of column 2
  check('claimeven move: P2 above a P1 disc is a claimeven', isClaimevenMove(b, 0, 2));
  check('claimeven move: P2 above its own disc is not', !isClaimevenMove(b, 1, 2));
  check('claimeven move: landing on an odd row is not', !isClaimevenMove(b, 2, 2));
  check('claimeven move: never a claimeven for player 1', !isClaimevenMove(b, 0, 1));
}

// ── 5. Baseinverse (Tier B) structural ────────────────────────
{
  // Empty board: 7 playable squares, all on the bottom row.
  const b = emptyBoard();
  check('baseinverse: empty board has 7 playable squares', playableSquares(b).length === 7);
  check('baseinverse: empty board has no forks yet', baseinverseForks(b, 1).length === 0);
}

{
  // P1 has two discs on the bottom row with two empty, directly-playable gaps:
  // a horizontal fork (both empties land on row 0).
  const b = emptyBoard();
  b[0][0] = 1;
  b[0][1] = 1;
  const forks = baseinverseForks(b, 1);
  const horiz = forks.find(
    f => f.empties.some(e => e[0] === 0 && e[1] === 2) && f.empties.some(e => e[0] === 0 && e[1] === 3),
  );
  check('baseinverse: two discs + two playable gaps make a fork', !!horiz);
  check('baseinverse: a fork is owned by its player only', baseinverseForks(b, 2).length === 0);
  // Both fork squares are in different columns (the crux of the guarantee).
  if (horiz) check('baseinverse: fork squares are in different columns', horiz.empties[0][1] !== horiz.empties[1][1]);
}

{
  // A vertical group is NOT a fork: its upper empty is not directly playable.
  const b = emptyBoard();
  b[0][0] = 1;
  b[1][0] = 1; // P1 stacked in column 1; empties (2,0) playable, (3,0) buried
  const vertical = baseinverseForks(b, 1).some(f =>
    f.empties.some(e => e[0] === 3 && e[1] === 0),
  );
  check('baseinverse: a vertical gap above a playable one is not a fork', !vertical);
}

// ── 6. Aftereven (Tier B) structural — detection foundation ───
{
  // P2 holds the odd-row cells of a horizontal group on an even row (row 2,
  // 0-indexed r=1); its two gaps are even squares with empty odd squares below,
  // so each gap is claimeven-controlled → an aftereven group.
  const b = emptyBoard();
  b[0][0] = 1; // fillers beneath the P2 row (no four); contents don't matter
  b[0][1] = 2;
  b[1][0] = 2;
  b[1][1] = 2; // P2 on (1,0),(1,1); gaps (1,2),(1,3) are even, odds below empty
  const groups = afterevenGroups(b, 2);
  const g = groups.find(
    x => x.evenEmpties.some(e => e[0] === 1 && e[1] === 2) && x.evenEmpties.some(e => e[0] === 1 && e[1] === 3),
  );
  check('aftereven: all-even claimeven-backed gaps form an aftereven group', !!g);

  // Break one gap's claimeven (fill the odd square below): no longer aftereven.
  const b2 = b.map(row => row.slice());
  b2[0][2] = 1;
  check(
    'aftereven: a broken claimeven under a gap disqualifies the group',
    !afterevenGroups(b2, 2).some(x => x.cells.some(s => s[0] === 1 && s[1] === 2)),
  );

  // An opponent disc anywhere in the group disqualifies it (not winnable).
  const b3 = b.map(row => row.slice());
  b3[1][2] = 1;
  check('aftereven: an opponent disc disqualifies the group', afterevenGroups(b3, 2).every(x => !x.cells.some(s => s[0] === 1 && s[1] === 2)));
}

{
  // Every gap of a detected aftereven group is an even square — an odd-row gap
  // can never qualify. (The bottom-row horizontal here is rejected; the all-even
  // horizontals higher up are legitimately aftereven groups, so we assert the
  // invariant on the gaps rather than that no group exists.)
  const b = emptyBoard();
  b[0][0] = 2;
  b[0][1] = 2; // P2 on the bottom (odd) row; its gaps (0,2),(0,3) are odd squares
  const groups = afterevenGroups(b, 2);
  check(
    'aftereven: every gap of a detected group is an even square',
    groups.every(g => g.evenEmpties.every(([r]) => rowParity(r) === 'even')),
  );
  check(
    'aftereven: the bottom (odd) row group is not detected',
    !groups.some(g => g.cells.every(([r]) => r === 0)),
  );
}

{
  // Allis diagram 6.4 (single-column): Black holds c2,d2,e2 on the even row; the
  // aftereven group c2-f2 needs only f2 (claimeven f1-f2). It solves all groups
  // needing a square above f2 in column f.
  const b = emptyBoard();
  b[0][2] = 1; b[0][3] = 1; b[0][4] = 1; // fillers beneath the Black row
  b[1][2] = 2; b[1][3] = 2; b[1][4] = 2; // Black c2,d2,e2; f2 (1,5) empty, f1 empty
  const cf = afterevenGroups(b, 2).find(
    g => g.cells.every(([r]) => r === 1) && g.cells.some(([, c]) => c === 2) && g.cells.some(([, c]) => c === 5),
  );
  check('aftereven 6.4: c2-f2 detected as an aftereven group', !!cf);
  if (cf) {
    const solved = threatsSolvedByAftereven(b, cf, 2);
    check('aftereven 6.4: solves the vertical above f2 (f3-f6)', solved.some(g => sameGroup(g, [[2, 5], [3, 5], [4, 5], [5, 5]])));
    check('aftereven 6.4: leaves a group outside column f unsolved', !solved.some(g => sameGroup(g, [[0, 0], [1, 0], [2, 0], [3, 0]])));
  }
}

{
  // Allis diagram 6.5 (two-column): aftereven group d2-g2 needs f2 AND g2, so it
  // only solves groups with a square above the empty in BOTH columns. c3-f3 is
  // explicitly NOT solved (it has no square in the g column).
  const b = emptyBoard();
  b[0][3] = 1; b[0][4] = 1;               // fillers beneath d2,e2
  b[1][3] = 2; b[1][4] = 2;               // Black d2,e2; f2 (1,5) and g2 (1,6) empty
  const dg = afterevenGroups(b, 2).find(
    g => g.cells.every(([r]) => r === 1) && g.cells.some(([, c]) => c === 3) && g.cells.some(([, c]) => c === 6),
  );
  check('aftereven 6.5: d2-g2 detected (two aftereven columns)', !!dg);
  if (dg) {
    const solved = threatsSolvedByAftereven(b, dg, 2);
    check('aftereven 6.5: solves a group spanning above both f and g', solved.some(g => sameGroup(g, [[2, 3], [2, 4], [2, 5], [2, 6]])));
    check('aftereven 6.5: does NOT solve c3-f3 (no g-column square)', !solved.some(g => sameGroup(g, [[2, 2], [2, 3], [2, 4], [2, 5]])));
    check('aftereven 6.5: does NOT solve an f-only vertical', !solved.some(g => sameGroup(g, [[2, 5], [3, 5], [4, 5], [5, 5]])));
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
