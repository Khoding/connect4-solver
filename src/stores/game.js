/*
 * Copyright (C) Pascal Pons (https://github.com/PascalPons/connect4)
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

import {ref, computed, watch} from 'vue';
import {defineStore} from 'pinia';
import i18n from '@/i18n';

const ROWS = 6;
const COLS = 7;

/* ── Pure helpers ───────────────────────────────────────── */

function constructBoardArr(moveString) {
  const b = Array.from({length: ROWS}, () => Array.from({length: COLS}, () => 0));
  for (let i = 0; i < moveString.length; i++) {
    const x = moveString.charCodeAt(i) - 49; // '1' = 49
    for (let y = 0; y < ROWS; y++) {
      if (b[y][x] === 0) {
        b[y][x] = (i % 2) + 1; // 1=first mover, 2=second mover (matches dataset)
        break;
      }
    }
  }
  return b;
}

function checkForWin(board) {
  const dirs = [
    {dx: 1, dy: 0},
    {dx: 0, dy: 1},
    {dx: 1, dy: 1},
    {dx: 1, dy: -1},
  ];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const p = board[y][x];
      if (p === 0) continue;
      for (const {dx, dy} of dirs) {
        const line = [[y, x]];
        for (let step = 1; step < 4; step++) {
          const nx = x + dx * step;
          const ny = y + dy * step;
          if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS || board[ny][nx] !== p) break;
          line.push([ny, nx]);
        }
        if (line.length === 4) return line;
      }
    }
  }
  return null;
}

/* ── WASM solver ───────────────────────────────────────── */

import * as wasmSolver from '@/solver/index.js';

function interpretScores(scores) {
  let bestCols = [];
  let bestScore = -Infinity;
  for (let i = 0; i < 7; i++) {
    if (scores[i] === -1000) continue; // column not playable
    if (scores[i] > bestScore) {
      bestScore = scores[i];
      bestCols = [i + 1];
    } else if (scores[i] === bestScore) {
      bestCols.push(i + 1);
    }
  }
  if (bestCols.length === 0) return null;
  const bestCol = bestCols[Math.floor(Math.random() * bestCols.length)];

  return {col: bestCol, bestCols, score: bestScore, scores, source: 'solver'};
}

/* ── Store ──────────────────────────────────────────────── */

export const useGameStore = defineStore('game', () => {
  const DEFAULT_ASIDE_ORDER = [
    'move-sequence',
    'game-controls',
    'export-import',
    'colors',
    'solver-status',
  ];

  const userIsFirst = ref(true); // does the human play as the first mover?
  const color1 = ref('#e03030'); // display color for the first player
  const color2 = ref('#e8d020'); // display color for the second player
  const hideHeader = ref(false);
  const hideFooter = ref(false);
  const hideMoveSequence = ref(false);
  const hideNavigation = ref(false);
  const hideReplay = ref(false);
  const hideExportImport = ref(false);
  const hideColors = ref(false);
  const hideSolverStatus = ref(false);
  const hideAutoplay = ref(false);
  const hideEvalBar = ref(false);
  const asideOrder = ref([...DEFAULT_ASIDE_ORDER]);
  const autoP1 = ref(false);
  const autoP2 = ref(false);
  const replayActive = ref(false);
  const loading = ref(true);
  const moveHistory = ref([]); // array of column numbers (1-7)
  const moveScores = ref([]); // solver score for each move at the time it was played (parallel to moveHistory)
  const moveOptimality = ref([]); // true if optimal, false if suboptimal, null if unknown (parallel to moveHistory)
  const moveBestScores = ref([]); // best available score at each ply, mover's perspective (parallel to moveHistory)
  const moveBestCols = ref([]); // best column (1-7) at each ply (parallel to moveHistory)
  const viewCursor = ref(0); // how many moves are currently displayed (0 = start)
  const resetPending = ref(false); // true when waiting for confirm
  const resignedPlayer = ref(0); // 0 = no resignation, 1 = P1 resigned, 2 = P2 resigned

  // Solver state
  const suggestion = ref(null);
  const solverScores = ref(null);
  const solverLoading = ref(false);
  const solverError = ref(null);
  const solverStatus = ref(wasmSolver.getStatus());

  // Ghost future moves state
  const showGhostMoves = ref(false);
  const ghostPath = ref([]);
  const ghostPathBasePos = ref(null);
  let ghostPathId = 0;

  let autoInterval = null;
  let replayInterval = null;
  let initialized = false;

  /* ── Derived ────────────────────────────────────────── */

  /** The move string up to the current cursor position */
  const repstr = computed(() => moveHistory.value.slice(0, viewCursor.value).join(''));

  const boardArr = computed(() => constructBoardArr(repstr.value));

  const winLine = computed(() => checkForWin(boardArr.value));

  const turnLength = computed(() => repstr.value.length);

  /** Internal player number whose turn it is: 1 = first mover, 2 = second mover */
  const internalCurrentPlayer = computed(() => (turnLength.value % 2 === 0 ? 1 : 2));

  const isUserTurn = computed(() => (internalCurrentPlayer.value === 1) === userIsFirst.value);

  /** Display label for whose turn it is */
  const currentPlayerLabel = computed(() =>
    isUserTurn.value ? i18n.global.t('moves.player_1') : i18n.global.t('moves.player_2'),
  );

  const isReviewingHistory = computed(() => viewCursor.value < moveHistory.value.length);
  const canStepBack = computed(() => viewCursor.value > 0);
  const canStepForward = computed(() => viewCursor.value < moveHistory.value.length);
  const totalMoves = computed(() => moveHistory.value.length);

  const ghostCells = computed(() => {
    if (
      !showGhostMoves.value ||
      isReviewingHistory.value ||
      replayActive.value ||
      !ghostPath.value ||
      ghostPath.value.length === 0
    ) {
      return [];
    }

    const currentBoard = boardArr.value;
    const heights = Array(COLS).fill(0);
    for (let c = 0; c < COLS; c++) {
      let h = 0;
      while (h < ROWS && currentBoard[h][c] !== 0) {
        h++;
      }
      heights[c] = h;
    }

    const cells = [];
    let currentPlayer = internalCurrentPlayer.value;

    for (let idx = 0; idx < ghostPath.value.length; idx++) {
      const col = ghostPath.value[idx];
      const c = col - 1;
      const h = heights[c];
      if (h < ROWS) {
        cells.push({
          row: h,
          col: c,
          player: currentPlayer,
          step: idx + 1,
        });
        heights[c]++;
      }
      currentPlayer = currentPlayer === 1 ? 2 : 1;
    }

    return cells;
  });

  /* ── WASM solver watcher ─────────────────────────────── */

  watch(
    [repstr, winLine, loading],
    async ([pos, win, isLoading]) => {
      suggestion.value = null;
      solverScores.value = null;
      solverError.value = null;
      solverLoading.value = false;

      if (isLoading || win) return;

      solverLoading.value = true;
      solverStatus.value = wasmSolver.getStatus();
      const queryPos = pos;
      try {
        const scores = await wasmSolver.analyze(queryPos);
        if (repstr.value !== queryPos) return; // stale
        solverScores.value = scores;
        suggestion.value = interpretScores(scores);
        solverStatus.value = wasmSolver.getStatus();
      } catch (e) {
        if (repstr.value === queryPos) solverError.value = e.message;
      } finally {
        if (repstr.value === queryPos) solverLoading.value = false;
      }
    },
    {immediate: true},
  );

  /* ── Ghost Path Calculator ───────────────────────────── */

  async function calculateGhostPath() {
    if (
      !showGhostMoves.value ||
      isReviewingHistory.value ||
      replayActive.value ||
      loading.value ||
      winLine.value
    ) {
      ghostPath.value = [];
      ghostPathBasePos.value = null;
      return;
    }

    const currentPos = repstr.value;

    // Follow the script if the current board position is the direct next sequence of the base position for which the script was computed
    if (ghostPath.value && ghostPath.value.length > 0 && ghostPathBasePos.value !== null) {
      const expectedNextMove = ghostPath.value[0];
      if (currentPos === ghostPathBasePos.value + expectedNextMove) {
        ghostPath.value = ghostPath.value.slice(1);
        ghostPathBasePos.value = currentPos;
        return;
      }
    }

    const currentId = ++ghostPathId;

    // Clear displayed ghost path immediately so UI is instantaneous, responsive, and doesn't display stale trails.
    ghostPath.value = [];
    ghostPathBasePos.value = currentPos;

    let tempMoves = currentPos;
    const path = [];
    const maxMoves = ROWS * COLS;
    const blockSize = 3;

    // Build the rest of the optimal game script step-by-step
    while (tempMoves.length < maxMoves) {
      if (currentId !== ghostPathId) return;

      const tempBoard = constructBoardArr(tempMoves);
      if (checkForWin(tempBoard)) {
        break;
      }

      let scores;
      try {
        scores = await wasmSolver.analyze(tempMoves);
      } catch (err) {
        console.error('Error calculating ghost path:', err);
        break;
      }

      if (currentId !== ghostPathId) return;

      let bestCols = [];
      let bestScore = -Infinity;
      for (let i = 0; i < 7; i++) {
        if (scores[i] === -1000) continue;
        if (scores[i] > bestScore) {
          bestScore = scores[i];
          bestCols = [i + 1];
        } else if (scores[i] === bestScore) {
          bestCols.push(i + 1);
        }
      }

      if (bestCols.length === 0) {
        break;
      }

      // Randomly select one of the equally optimal best columns (as requested)
      const chosenCol = bestCols[Math.floor(Math.random() * bestCols.length)];
      path.push(chosenCol);
      tempMoves += chosenCol;

      // Group steps of calculation in blocks of 3, rendering them to the screen dynamically and yielding back to the browser
      if (path.length % blockSize === 0) {
        ghostPath.value = [...path];
        await new Promise(resolve => setTimeout(resolve, 0));
        if (currentId !== ghostPathId) return;
      }
    }

    if (currentId === ghostPathId) {
      ghostPath.value = path;
    }
  }

  // Watch for changes and regenerate/update the path
  watch(
    [repstr, showGhostMoves, winLine, loading, replayActive, isReviewingHistory],
    () => {
      calculateGhostPath();
    },
    {immediate: true},
  );

  /* ── Historical Scores/Optimality Solver ─────────────── */

  let analysisRunId = 0;

  async function fillHistoricalScores() {
    const s = solverStatus.value;
    if (!s?.moduleReady) return;

    analysisRunId++;
    const currentRunId = analysisRunId;

    const history = [...moveHistory.value];
    const n = history.length;

    // Ensure our arrays have at least n length (padded with null)
    while (moveScores.value.length < n) {
      moveScores.value.push(null);
    }
    while (moveOptimality.value.length < n) {
      moveOptimality.value.push(null);
    }
    while (moveBestScores.value.length < n) {
      moveBestScores.value.push(null);
    }
    while (moveBestCols.value.length < n) {
      moveBestCols.value.push(null);
    }

    for (let i = 0; i < n; i++) {
      if (currentRunId !== analysisRunId) return; // aborted by a newer run

      // Check if we need to compute this move
      if (
        moveScores.value[i] !== null &&
        moveScores.value[i] !== undefined &&
        moveOptimality.value[i] !== null &&
        moveOptimality.value[i] !== undefined &&
        moveBestScores.value[i] !== null &&
        moveBestScores.value[i] !== undefined &&
        moveBestCols.value[i] !== null &&
        moveBestCols.value[i] !== undefined
      ) {
        continue;
      }

      const prefix = history.slice(0, i).join('');
      const col = history[i];

      try {
        const scores = await wasmSolver.analyze(prefix);
        if (currentRunId !== analysisRunId) return;

        const colIndex = col - 1;
        const scoreForMove = scores[colIndex];

        let bestScore = -Infinity;
        let bestColIndex = -1;
        for (let c = 0; c < 7; c++) {
          if (scores[c] !== -1000 && scores[c] > bestScore) {
            bestScore = scores[c];
            bestColIndex = c;
          }
        }

        const isOptimal = scoreForMove !== -1000 && scoreForMove === bestScore;

        if (moveHistory.value[i] === col && moveHistory.value.length === n) {
          moveScores.value[i] = scoreForMove !== -1000 ? scoreForMove : null;
          moveOptimality.value[i] = isOptimal;
          moveBestScores.value[i] = bestScore !== -Infinity ? bestScore : null;
          moveBestCols.value[i] = bestColIndex >= 0 ? bestColIndex + 1 : null;
        }
      } catch (err) {
        console.error(`Failed to analyze historical move at index ${i}`, err);
      }
    }
  }

  watch(
    [moveHistory, solverStatus],
    () => {
      fillHistoricalScores();
    },
    {deep: true, immediate: true},
  );

  const solverStatusText = computed(() => {
    const s = solverStatus.value;
    if (!s?.moduleReady) return i18n.global.t('solver.status.loading_wasm');
    if (s.bookLoading) return i18n.global.t('solver.status.loading_book');
    if (s.bookError) return i18n.global.t('solver.status.book_error', {error: s.bookError});
    if (s.bookLoaded) return i18n.global.t('solver.status.ready_book');
    return i18n.global.t('solver.status.ready_no_book');
  });

  /* ── Full-game outcome (independent of the review cursor) ── */

  /** Board for the complete move history, ignoring the review cursor */
  const fullBoard = computed(() => constructBoardArr(moveHistory.value.join('')));
  const fullWinLine = computed(() => checkForWin(fullBoard.value));

  /** Whether the full move history (regardless of viewCursor) contains a win */
  const gameHasWin = computed(() => fullWinLine.value !== null);

  /** Winning player number (1 or 2), or 0 if none */
  const winner = computed(() => {
    if (resignedPlayer.value === 1) return 2;
    if (resignedPlayer.value === 2) return 1;
    const wl = fullWinLine.value;
    if (!wl?.length) return 0;
    const [y, x] = wl[0];
    return fullBoard.value[y][x];
  });

  const isDraw = computed(() => !fullWinLine.value && moveHistory.value.length >= ROWS * COLS);
  const gameOver = computed(
    () =>
      !!fullWinLine.value || moveHistory.value.length >= ROWS * COLS || resignedPlayer.value !== 0,
  );

  // Watch if game is over to automatically deactivate autoplay
  watch(
    gameOver,
    isOver => {
      if (isOver) {
        deactivateAutoplay();
      }
    },
    {immediate: true},
  );

  /** Position evaluation for both players (score relative to each) */
  const positionEval = computed(() => {
    const sug = suggestion.value;
    if (!sug) return null;
    const currentScore = sug.score;
    const currentIsFirst = internalCurrentPlayer.value === 1;
    return {
      first: currentIsFirst ? currentScore : -currentScore,
      second: currentIsFirst ? -currentScore : currentScore,
    };
  });

  /* ── Display color mapping ──────────────────────────── */

  /** Map internal player (1=first mover, 2=second) to a display color hex string */
  function displayColorOf(internalPlayer) {
    if (internalPlayer === 0) return 'transparent';
    return internalPlayer === 1 ? color1.value : color2.value;
  }

  /* ── Actions ────────────────────────────────────────── */

  function makeMove(column, isManual = true) {
    if (winLine.value || resignedPlayer.value !== 0) return;
    const x = column - 1;
    if (x < 0 || x >= COLS) return;
    if (boardArr.value[ROWS - 1][x] !== 0) return;

    if (
      isManual &&
      ((internalCurrentPlayer.value === 1 && autoP1.value) ||
        (internalCurrentPlayer.value === 2 && autoP2.value))
    ) {
      deactivateAutoplay();
    }

    // If reviewing history, truncate future moves
    if (viewCursor.value < moveHistory.value.length) {
      moveHistory.value = moveHistory.value.slice(0, viewCursor.value);
      moveScores.value = moveScores.value.slice(0, viewCursor.value);
      moveOptimality.value = moveOptimality.value.slice(0, viewCursor.value);
      moveBestScores.value = moveBestScores.value.slice(0, viewCursor.value);
      moveBestCols.value = moveBestCols.value.slice(0, viewCursor.value);
    }

    // Record the solver score for the chosen column (from current player's perspective)
    const colIndex = column - 1;
    const scoreForMove = solverScores.value ? solverScores.value[colIndex] : null;
    const bestScore = suggestion.value ? suggestion.value.score : null;

    let isOptimal = null;
    if (scoreForMove != null && bestScore != null && scoreForMove !== -1000) {
      isOptimal = scoreForMove === bestScore;
    }

    moveScores.value.push(scoreForMove !== -1000 ? scoreForMove : null);
    moveOptimality.value.push(isOptimal);
    moveBestScores.value.push(bestScore);
    moveBestCols.value.push(suggestion.value?.bestCols?.[0] ?? null);

    moveHistory.value.push(column);
    viewCursor.value = moveHistory.value.length;
    resetPending.value = false;

    saveState();
    syncUrl();
  }

  function makeAutoMove() {
    if (replayActive.value) return;
    if (winLine.value) return;

    // Use the ghost prediction moves if active and available, otherwise fallback to solver suggestion
    if (showGhostMoves.value && ghostPath.value && ghostPath.value.length > 0) {
      makeMove(ghostPath.value[0], false);
    } else if (suggestion.value?.col > 0) {
      makeMove(suggestion.value.col, false);
    }
  }

  function stepBack() {
    deactivateAutoplay();
    if (viewCursor.value > 0) {
      const steps = autoP1.value && autoP2.value ? 1 : autoP1.value || autoP2.value ? 2 : 1;
      viewCursor.value = Math.max(0, viewCursor.value - steps);
      syncUrl();
    }
  }

  function stepForward() {
    deactivateAutoplay();
    if (viewCursor.value < moveHistory.value.length) {
      const steps = autoP1.value && autoP2.value ? 1 : autoP1.value || autoP2.value ? 2 : 1;
      viewCursor.value = Math.min(moveHistory.value.length, viewCursor.value + steps);
      syncUrl();
    }
  }

  function goToLatest() {
    deactivateAutoplay();
    viewCursor.value = moveHistory.value.length;
    syncUrl();
  }

  function resetBoard() {
    deactivateAutoplay();
    if (!resetPending.value) {
      resetPending.value = true;
      return;
    }
    moveHistory.value = [];
    moveScores.value = [];
    moveOptimality.value = [];
    moveBestScores.value = [];
    moveBestCols.value = [];
    viewCursor.value = 0;
    resetPending.value = false;
    resignedPlayer.value = 0;
    saveState();
    syncUrl();
  }

  function cancelReset() {
    resetPending.value = false;
  }

  function resign(player) {
    if (resignedPlayer.value || gameOver.value) return;
    resignedPlayer.value = player;
    saveState();
  }

  function undoResign() {
    resignedPlayer.value = 0;
    saveState();
  }

  function loadMoves(moveString) {
    deactivateAutoplay();
    const history = [];
    const scores = [];
    const optimality = [];
    const bestScores = [];
    const bestCols = [];

    for (let i = 0; i < moveString.length; i++) {
      const col = parseInt(moveString[i]);
      if (col >= 1 && col <= 7) {
        const currentBoard = constructBoardArr(history.join(''));
        const x = col - 1;
        if (currentBoard[ROWS - 1][x] === 0 && !checkForWin(currentBoard)) {
          history.push(col);
          scores.push(null);
          optimality.push(null);
          bestScores.push(null);
          bestCols.push(null);
        }
      }
    }

    moveHistory.value = history;
    moveScores.value = scores;
    moveOptimality.value = optimality;
    moveBestScores.value = bestScores;
    moveBestCols.value = bestCols;
    viewCursor.value = history.length;
    resetPending.value = false;
    resignedPlayer.value = 0;
    saveState();
    syncUrl();
  }

  function setUserIsFirst(val) {
    userIsFirst.value = val;
    saveState();
  }

  function setColor1(hex) {
    color1.value = hex;
    saveState();
  }

  function setColor2(hex) {
    color2.value = hex;
    saveState();
  }

  function setHideHeader(val) {
    hideHeader.value = val;
    saveState();
  }

  function setHideFooter(val) {
    hideFooter.value = val;
    saveState();
  }

  function setHideMoveSequence(val) {
    hideMoveSequence.value = val;
    saveState();
  }

  function setHideNavigation(val) {
    hideNavigation.value = val;
    saveState();
  }

  function setHideReplay(val) {
    hideReplay.value = val;
    saveState();
  }

  function setHideExportImport(val) {
    hideExportImport.value = val;
    saveState();
  }

  function setHideColors(val) {
    hideColors.value = val;
    saveState();
  }

  function setHideSolverStatus(val) {
    hideSolverStatus.value = val;
    saveState();
  }

  function setHideAutoplay(val) {
    hideAutoplay.value = val;
    saveState();
  }

  function setHideEvalBar(val) {
    hideEvalBar.value = val;
    saveState();
  }

  function moveAsideItem(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= asideOrder.value.length) return;
    const temp = asideOrder.value[index];
    asideOrder.value[index] = asideOrder.value[newIndex];
    asideOrder.value[newIndex] = temp;
    saveState();
  }

  function resetAsideOrder() {
    asideOrder.value = [...DEFAULT_ASIDE_ORDER];
    saveState();
  }

  function setAsideOrder(newOrder) {
    asideOrder.value = [...newOrder];
    saveState();
  }

  function applyRecommendedLayout() {
    hideHeader.value = true;
    hideReplay.value = true;
    hideSolverStatus.value = true;
    hideFooter.value = true;

    hideMoveSequence.value = false;
    hideAutoplay.value = false;
    hideEvalBar.value = false;
    hideNavigation.value = false;
    hideExportImport.value = false;
    hideColors.value = false;

    asideOrder.value = [...DEFAULT_ASIDE_ORDER];
    saveState();
  }

  function swapColors() {
    const tmp = color1.value;
    color1.value = color2.value;
    color2.value = tmp;
    saveState();
  }

  function startReplay() {
    if (replayActive.value) return;
    deactivateAutoplay();
    stopReplay();
    replayActive.value = true;
    viewCursor.value = 0;
    replayInterval = setInterval(() => {
      if (viewCursor.value < moveHistory.value.length) {
        viewCursor.value++;
      } else {
        stopReplay();
      }
    }, 750);
  }

  function continueReplay() {
    if (replayActive.value) return;
    if (viewCursor.value >= moveHistory.value.length) return;
    deactivateAutoplay();
    replayActive.value = true;
    replayInterval = setInterval(() => {
      if (viewCursor.value < moveHistory.value.length) {
        viewCursor.value++;
      } else {
        stopReplay();
      }
    }, 750);
  }

  function stopReplay() {
    replayActive.value = false;
    clearInterval(replayInterval);
    replayInterval = null;
  }

  function deactivateAutoplay() {
    autoP1.value = false;
    autoP2.value = false;
    updateAutoInterval();
  }

  function updateAutoInterval() {
    if (autoP1.value || autoP2.value) {
      if (!autoInterval) {
        autoInterval = setInterval(() => {
          if (winLine.value) return;
          // P1 is internalCurrentPlayer === 1
          if (internalCurrentPlayer.value === 1 && autoP1.value) {
            makeAutoMove();
          } else if (internalCurrentPlayer.value === 2 && autoP2.value) {
            makeAutoMove();
          }
        }, 750);
      }
    } else {
      clearInterval(autoInterval);
      autoInterval = null;
    }
  }

  function toggleAutoP1() {
    autoP1.value = !autoP1.value;
    updateAutoInterval();
  }

  function toggleAutoP2() {
    autoP2.value = !autoP2.value;
    updateAutoInterval();
  }

  function toggleAutoBoth() {
    const next = !(autoP1.value && autoP2.value);
    autoP1.value = next;
    autoP2.value = next;
    updateAutoInterval();
  }

  function toggleGhostMoves() {
    showGhostMoves.value = !showGhostMoves.value;
    saveState();
  }

  /* ── Persistence ────────────────────────────────────── */

  function saveState() {
    try {
      localStorage.setItem(
        'c4_state',
        JSON.stringify({
          moves: moveHistory.value.join(''),
          optimality: moveOptimality.value.map(v => (v === true ? 1 : v === false ? 0 : null)),
          resignedPlayer: resignedPlayer.value || undefined,
          userIsFirst: userIsFirst.value,
          color1: color1.value,
          color2: color2.value,
          hideHeader: hideHeader.value,
          hideFooter: hideFooter.value,
          hideMoveSequence: hideMoveSequence.value,
          hideNavigation: hideNavigation.value,
          hideReplay: hideReplay.value,
          hideExportImport: hideExportImport.value,
          hideColors: hideColors.value,
          hideSolverStatus: hideSolverStatus.value,
          hideAutoplay: hideAutoplay.value,
          hideEvalBar: hideEvalBar.value,
          showGhostMoves: showGhostMoves.value,
          asideOrder: asideOrder.value,
        }),
      );
    } catch {
      /* storage full or unavailable */
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem('c4_state');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function syncUrl() {
    const url = new URL(window.location);
    if (repstr.value) {
      url.searchParams.set('pos', repstr.value);
    } else {
      url.searchParams.delete('pos');
    }
    window.history.replaceState({}, '', url);
  }

  /* ── Init ───────────────────────────────────────────── */

  async function init() {
    if (initialized) return;
    initialized = true;

    moveHistory.value = [];
    moveScores.value = [];
    moveOptimality.value = [];
    moveBestScores.value = [];
    moveBestCols.value = [];
    viewCursor.value = 0;

    // Check URL for position, then fall back to saved state
    const urlParams = new URLSearchParams(window.location.search);
    const urlPos = urlParams.get('pos');
    const saved = loadState();

    const restoreMoves = urlPos || saved?.moves || '';

    if (saved) {
      if (typeof saved.userIsFirst === 'boolean') userIsFirst.value = saved.userIsFirst;
      if (saved.color1) color1.value = saved.color1;
      if (saved.color2) color2.value = saved.color2;
      if (typeof saved.hideHeader === 'boolean') hideHeader.value = saved.hideHeader;
      if (typeof saved.hideFooter === 'boolean') hideFooter.value = saved.hideFooter;
      if (typeof saved.hideMoveSequence === 'boolean')
        hideMoveSequence.value = saved.hideMoveSequence;
      if (typeof saved.hideNavigation === 'boolean') hideNavigation.value = saved.hideNavigation;
      if (typeof saved.hideReplay === 'boolean') hideReplay.value = saved.hideReplay;
      if (typeof saved.hideExportImport === 'boolean')
        hideExportImport.value = saved.hideExportImport;
      if (typeof saved.hideColors === 'boolean') hideColors.value = saved.hideColors;
      if (typeof saved.hideSolverStatus === 'boolean')
        hideSolverStatus.value = saved.hideSolverStatus;
      if (typeof saved.hideAutoplay === 'boolean') hideAutoplay.value = saved.hideAutoplay;
      if (typeof saved.hideEvalBar === 'boolean') hideEvalBar.value = saved.hideEvalBar;
      if (typeof saved.showGhostMoves === 'boolean') showGhostMoves.value = saved.showGhostMoves;
      if (Array.isArray(saved.asideOrder)) {
        const isValid =
          saved.asideOrder.every(item => DEFAULT_ASIDE_ORDER.includes(item)) &&
          saved.asideOrder.length === DEFAULT_ASIDE_ORDER.length;
        if (isValid) {
          asideOrder.value = saved.asideOrder;
        } else {
          asideOrder.value = [...DEFAULT_ASIDE_ORDER];
        }
      }
      if (!urlPos && (saved.resignedPlayer === 1 || saved.resignedPlayer === 2))
        resignedPlayer.value = saved.resignedPlayer;
    }

    // Replay moves
    if (restoreMoves) {
      for (let i = 0; i < restoreMoves.length; i++) {
        const col = parseInt(restoreMoves[i]);
        if (col >= 1 && col <= 7) {
          const currentBoard = constructBoardArr(moveHistory.value.join(''));
          const x = col - 1;
          if (currentBoard[ROWS - 1][x] === 0 && !checkForWin(currentBoard)) {
            moveHistory.value.push(col);
            moveOptimality.value.push(
              saved?.optimality?.[i] === 1 ? true : saved?.optimality?.[i] === 0 ? false : null,
            );
          }
        }
      }
      viewCursor.value = moveHistory.value.length;
    }

    syncUrl();
    loading.value = false;

    // Start loading WASM solver + opening book in background
    wasmSolver.warmup().then(() => {
      solverStatus.value = wasmSolver.getStatus();
    });
  }

  return {
    // Constants
    ROWS,
    COLS,
    // State
    userIsFirst,
    color1,
    color2,
    hideHeader,
    hideFooter,
    hideMoveSequence,
    hideNavigation,
    hideReplay,
    hideExportImport,
    hideColors,
    hideSolverStatus,
    hideAutoplay,
    hideEvalBar,
    autoP1,
    autoP2,
    asideOrder,
    DEFAULT_ASIDE_ORDER,
    replayActive,
    loading,
    moveHistory,
    moveScores,
    moveOptimality,
    moveBestScores,
    moveBestCols,
    viewCursor,
    resetPending,
    resignedPlayer,
    showGhostMoves,
    ghostPath,
    // Solver
    suggestion,
    solverScores,
    solverLoading,
    solverError,
    solverStatus,
    // Computed
    repstr,
    boardArr,
    winLine,
    internalCurrentPlayer,
    currentPlayerLabel,
    isUserTurn,
    solverStatusText,
    isReviewingHistory,
    canStepBack,
    canStepForward,
    totalMoves,
    gameHasWin,
    fullBoard,
    fullWinLine,
    winner,
    isDraw,
    gameOver,
    positionEval,
    ghostCells,
    // Helpers
    displayColorOf,
    // Actions
    init,
    makeMove,
    stepBack,
    stepForward,
    goToLatest,
    resetBoard,
    cancelReset,
    resign,
    undoResign,
    loadMoves,
    setUserIsFirst,
    setColor1,
    setColor2,
    setHideHeader,
    setHideFooter,
    setHideMoveSequence,
    setHideNavigation,
    setHideReplay,
    setHideExportImport,
    setHideColors,
    setHideSolverStatus,
    setHideAutoplay,
    setHideEvalBar,
    swapColors,
    moveAsideItem,
    resetAsideOrder,
    setAsideOrder,
    applyRecommendedLayout,
    toggleAutoP1,
    toggleAutoP2,
    toggleAutoBoth,
    toggleGhostMoves,
    deactivateAutoplay,
    startReplay,
    continueReplay,
    stopReplay,
  };
});
