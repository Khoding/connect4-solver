/*
 * Copyright (C) 2026 Khodok — AGPL-3.0 (see app/learn/*.js headers).
 *
 * Validation harness for practice mode (app/learn/drills.js).
 *
 * Run: node scripts/validate-drills.mjs
 *
 * The real generator runs on the WASM solver, which needs the node-targeted
 * build (see scripts/solver-oracle.mjs). Everything that can break without it
 * is checked here against a stub scorer: the walk's accept/reject rules, the
 * budget and restart paths, the grader's tiers, and the invariant that the
 * drill grader and the Learn card name the same move the same way.
 */

import {
  generateDrill,
  gradeAnswer,
  explainRefutation,
  quietProfile,
  DRILL_CONCEPTS,
} from '../app/learn/drills.js';
import {classifyHint, nameMove} from '../app/learn/classifier.js';
import {boardFromMoves, moverAfter} from '../app/learn/examples.js';
import {wouldWin, landingRow, COLS} from '../app/learn/threats.js';

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

/* ── A deterministic pseudo-random source, so failures reproduce ───────── */

function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ── Stub scorer ───────────────────────────────────────────────────────────
 * Not a solver: a cheap heuristic that still produces the shape the generator
 * consumes — an unplayable marker, a clear best, and a spread between columns.
 */

function stubAnalyze(moves) {
  const board = boardFromMoves(moves);
  const player = moverAfter(moves);
  const opponent = player === 1 ? 2 : 1;
  const scores = [];
  for (let c = 0; c < COLS; c++) {
    if (landingRow(board, c) === -1) {
      scores.push(-1000);
      continue;
    }
    let v = 3 - Math.abs(3 - c); // centre bias, 0..3
    if (wouldWin(board, c, player)) v += 18;
    else if (wouldWin(board, c, opponent)) v += 12;
    scores.push(v);
  }
  return Promise.resolve(scores);
}

/* ── 1 · nameMove agrees with the Learn card ───────────────────────────── */

// classifyHint must keep naming the recommended column exactly as nameMove
// does, or the drill's "you played X, Y was better" contrasts two vocabularies.
{
  const rng = makeRng(20260917);
  let checked = 0;
  for (let game = 0; game < 400; game++) {
    let moves = '';
    for (let ply = 0; ply < 20; ply++) {
      const board = boardFromMoves(moves);
      const player = moverAfter(moves);
      const scores = await stubAnalyze(moves);
      const hint = classifyHint(board, scores, player);
      if (hint) {
        const named = nameMove(board, hint.bestCol - 1, player);
        check(`nameMove agrees with classifyHint at "${moves}"`, named.concept === hint.concept);
        check(`parity agrees at "${moves}"`, named.parity === hint.parity);
        checked++;
      }
      const legal = [];
      for (let c = 0; c < COLS; c++) if (landingRow(board, c) !== -1) legal.push(c);
      if (!legal.length) break;
      const col = legal[Math.floor(rng() * legal.length)];
      if (wouldWin(board, col, player)) break;
      moves += String(col + 1);
    }
  }
  check('nameMove agreement actually exercised', checked > 1000);
}

/* ── 2 · Generated drills satisfy the contract they advertise ──────────── */

for (const target of DRILL_CONCEPTS) {
  const drill = await generateDrill(target, {
    analyze: stubAnalyze,
    rng: makeRng(7 + target.length),
    budget: 400,
  });
  // The stub cannot manufacture every concept; only assert on what it finds.
  if (!drill) continue;

  check(`${target}: concept matches the request`, target === 'any' || drill.concept === target);
  check(`${target}: hint concept matches the request`, target === 'any' || drill.hint.concept === target);
  check(`${target}: position is deep enough`, drill.moves.length >= 6);
  check(`${target}: answer is not ambiguous`, drill.bestCols.length <= 2);

  const playable = drill.scores.filter(s => s !== -1000);
  check(`${target}: a real choice exists`, playable.length >= 3);
  check(`${target}: best score is the maximum`, drill.bestScore === Math.max(...playable));
  const spread = drill.bestScore - Math.min(...playable);
  check(`${target}: position discriminates`, spread >= 4 || (drill.bestScore >= 0 && Math.min(...playable) < 0));

  // Board and mover must be reconstructible from the move string alone, since
  // that is all the reroll/share paths carry.
  check(`${target}: mover matches the move string`, drill.player === moverAfter(drill.moves));
  const rebuilt = boardFromMoves(drill.moves);
  check(
    `${target}: board matches the move string`,
    JSON.stringify(rebuilt) === JSON.stringify(drill.board),
  );

  // Every best column must grade as correct, and never worse than 'best'.
  for (const col of drill.bestCols) {
    const g = gradeAnswer(drill, col);
    check(`${target}: best column ${col} grades correct`, g?.correct === true);
    check(`${target}: best column ${col} is tier best`, g?.tier === 'best');
    check(`${target}: best column ${col} has no delta`, g?.delta === 0);
  }

  // Every other playable column grades, and never claims to be the answer.
  for (let c = 0; c < COLS; c++) {
    if (drill.scores[c] === -1000) {
      check(`${target}: unplayable column ${c + 1} refuses grading`, gradeAnswer(drill, c + 1) === null);
      continue;
    }
    const g = gradeAnswer(drill, c + 1);
    check(`${target}: column ${c + 1} grades`, g !== null);
    check(`${target}: delta is never negative on ${c + 1}`, g.delta >= 0);
    check(
      `${target}: correctness matches bestCols on ${c + 1}`,
      g.correct === drill.bestCols.includes(c + 1),
    );
    check(`${target}: names the played move on ${c + 1}`, typeof g.playedConcept === 'string');
  }
}

/* ── 3 · The walk gives up instead of hanging ──────────────────────────── */

{
  // No position can satisfy this, so the generator must exhaust its budget and
  // return null rather than loop.
  let calls = 0;
  const counting = moves => {
    calls++;
    return stubAnalyze(moves);
  };
  const drill = await generateDrill('no-such-concept', {
    analyze: counting,
    rng: makeRng(11),
    budget: 40,
  });
  check('impossible target returns null', drill === null);
  check('impossible target respects the budget', calls === 40);
}

{
  // A cancelled generation stops early and returns nothing.
  let calls = 0;
  const drill = await generateDrill('any', {
    analyze: moves => {
      calls++;
      return stubAnalyze(moves);
    },
    rng: makeRng(3),
    budget: 200,
    cancelled: () => calls >= 5,
  });
  check('cancellation stops the walk', drill === null && calls <= 6);
}

/* ── 4 · Grader tiers and outcome shifts ───────────────────────────────── */

{
  const board = boardFromMoves('4455');
  const drill = {
    moves: '4455',
    board,
    player: moverAfter('4455'),
    scores: [-1000, 0, 6, 11, -4, 2, 9],
    bestCols: [4],
    bestScore: 11,
    hint: {concept: 'develop', bestCols: [4]},
  };

  check('exact best is best', gradeAnswer(drill, 4).tier === 'best');
  check('within two is good', gradeAnswer(drill, 7).tier === 'good');
  check('a win traded for a draw is a mistake', gradeAnswer(drill, 2).tier === 'mistake');
  check('a win traded for a loss is a blunder', gradeAnswer(drill, 5).tier === 'blunder');
  check('unplayable column returns null', gradeAnswer(drill, 1) === null);

  check('same outcome reads as slower', gradeAnswer(drill, 7).shift === 'slower');
  check('win to draw is flagged', gradeAnswer(drill, 2).shift === 'win_to_draw');
  check('win to loss is flagged', gradeAnswer(drill, 5).shift === 'win_to_loss');
  check('the best move shifts nothing', gradeAnswer(drill, 4).shift === 'same');
  check('null drill grades to null', gradeAnswer(null, 4) === null);

  // A lost position still grades: the choice is how fast you lose.
  const lost = {...drill, scores: [-1000, -3, -9, -3, -14, -3, -3], bestCols: [2, 4, 6, 7], bestScore: -3};
  check('a faster defeat is flagged', gradeAnswer(lost, 5).shift === 'sooner');
  check('the least-bad move shifts nothing', gradeAnswer(lost, 2).shift === 'same');
  check('a lost position never reports a win shift', gradeAnswer(lost, 3).shift === 'sooner');
}

/* ── 5 · Quiet-move profile ────────────────────────────────────────────── */

{
  // Column 4 on an empty board sits in the most fours of any opening move, and
  // the first player's disc lands on row 1 — their own parity.
  const empty = boardFromMoves('');
  const centre = quietProfile(empty, 3, 1);
  check('centre move counts its fours', centre.lines === 7);
  check('centre move lands on row 1', centre.row === 0);
  check('row 1 is the first player parity', centre.onParity === true);
  check('the second player does not own row 1', quietProfile(empty, 3, 2).onParity === false);

  // An edge column joins fewer fours than the centre: the guide's habit #1.
  check('edge joins fewer fours', quietProfile(empty, 0, 1).lines < centre.lines);

  // Opponent discs in a four take it out of the count. Same landing square in
  // both boards, so the only difference is the enemy disc on a1: it kills the
  // one horizontal four a1-d1 that runs through d1.
  const contested = boardFromMoves('1');
  check(
    'an opponent disc removes a four from the count',
    quietProfile(contested, 3, 2).lines === quietProfile(empty, 3, 2).lines - 1,
  );
  check(
    'the landing square is unchanged by that disc',
    quietProfile(contested, 3, 2).row === quietProfile(empty, 3, 2).row,
  );

  // A full column has no profile.
  check('a full column has no profile', quietProfile(boardFromMoves('111111'), 0, 1) === null);
}

/* ── 6 · Refutation lookup ─────────────────────────────────────────────── */

{
  const moves = '4455';
  const board = boardFromMoves(moves);
  const drill = {
    moves,
    board,
    player: moverAfter(moves),
    scores: [-1000, 0, 6, 11, -4, 2, 9],
    bestCols: [4],
    bestScore: 11,
    hint: {concept: 'develop', bestCols: [4]},
  };

  const punished = await explainRefutation(drill, 2, stubAnalyze);
  check('a refutation names a column', punished !== null && punished.col >= 1 && punished.col <= 7);
  check('a refutation names the reply', typeof punished?.concept === 'string');
  check('every listed reply ties for best', punished.cols.includes(punished.col));

  check('the best move has no refutation', (await explainRefutation(drill, 4, stubAnalyze)) === null);
  check(
    'an unplayable column has no refutation',
    (await explainRefutation(drill, 1, stubAnalyze)) === null,
  );
  check('a null drill has no refutation', (await explainRefutation(null, 3, stubAnalyze)) === null);

  // A move that wins on the spot is never "punished": there is no reply.
  const winning = boardFromMoves('112233');
  const winDrill = {
    moves: '112233',
    board: winning,
    player: moverAfter('112233'),
    scores: [5, 5, 5, 20, 5, 5, 5],
    bestCols: [4],
    bestScore: 20,
    hint: {concept: 'win', bestCols: [4]},
  };
  const winCol = [1, 2, 3, 5, 6, 7].find(c => wouldWin(winning, c - 1, winDrill.player));
  if (winCol) {
    check(
      'a winning move has no refutation',
      (await explainRefutation(winDrill, winCol, stubAnalyze)) === null,
    );
  }
}

/* ── Report ───────────────────────────────────────────────────────────── */

console.log(`Practice-drill validation: ${passed} passed, ${failed} failed`);
if (failed) {
  console.error('\nFailures:');
  for (const f of fails.slice(0, 25)) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('Drill generator and grader hold ✅');
