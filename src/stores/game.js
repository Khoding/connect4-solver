import {ref, computed, watch} from 'vue';
import {defineStore} from 'pinia';

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
  let bestCol = -1;
  let bestScore = -Infinity;
  for (let i = 0; i < 7; i++) {
    if (scores[i] === -1000) continue; // column not playable
    if (scores[i] > bestScore) {
      bestScore = scores[i];
      bestCol = i + 1;
    }
  }
  if (bestCol === -1) return null;

  let reason;
  if (bestScore > 0) reason = 'Winning move (solver)';
  else if (bestScore === 0) reason = 'Drawing move (solver)';
  else reason = 'Best defense (solver)';

  return {col: bestCol, reason, score: bestScore, scores, source: 'solver'};
}

/* ── Store ──────────────────────────────────────────────── */

export const useGameStore = defineStore('game', () => {
  const userIsFirst = ref(true); // does the human play as the first mover?
  const color1 = ref('#e03030'); // display color for the first player
  const color2 = ref('#e8d020'); // display color for the second player
  const autoEnabled = ref(false);
  const replayActive = ref(false);
  const loading = ref(true);
  const moveHistory = ref([]); // array of column numbers (1-7)
  const moveScores = ref([]); // solver score for each move at the time it was played (parallel to moveHistory)
  const viewCursor = ref(0); // how many moves are currently displayed (0 = start)
  const resetPending = ref(false); // true when waiting for confirm

  // Solver state
  const suggestion = ref(null);
  const solverScores = ref(null);
  const solverLoading = ref(false);
  const solverError = ref(null);
  const solverStatus = ref(wasmSolver.getStatus());

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
  const currentPlayerLabel = computed(() => (isUserTurn.value ? '1st player' : '2nd player'));

  /* ── WASM solver watcher ─────────────────────────────── */

  watch(
    [repstr, winLine, loading],
    async ([pos, win, isLoading]) => {
      suggestion.value = null;
      solverScores.value = null;
      solverError.value = null;
      solverLoading.value = false;

      if (isLoading || win) return;
      if (pos.length === 0) return; // no need to solve the empty board

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

  const suggestionText = computed(() => {
    if (solverLoading.value) {
      if (!solverStatus.value?.bookLoaded) return 'Loading opening book…';
      return 'Querying solver…';
    }
    if (suggestion.value?.col > 0) return `Column ${suggestion.value.col}`;
    if (winLine.value) return 'Game over';
    return '—';
  });

  const suggestionLabel = computed(() => {
    const sug = suggestion.value;
    if (!sug || sug.col <= 0) return '';
    return sug.reason;
  });

  const solverStatusText = computed(() => {
    const s = solverStatus.value;
    if (!s?.moduleReady) return 'Loading WASM module…';
    if (s.bookLoading) return 'Loading opening book…';
    if (s.bookError) return `Book error: ${s.bookError}`;
    if (s.bookLoaded) return 'Ready (with opening book)';
    return 'Ready (no opening book)';
  });

  const statusTitle = computed(() => {
    if (winLine.value) {
      const winnerInternal = boardArr.value[winLine.value[0][0]][winLine.value[0][1]];
      return winnerInternal === 1 ? '1st player wins!' : '2nd player wins!';
    }
    return isUserTurn.value ? "1st player's turn" : "2nd player's turn";
  });

  const statusText = computed(() => {
    if (winLine.value) return 'Press Reset to start over.';
    if (viewCursor.value < moveHistory.value.length)
      return 'Reviewing history — use ▶ to step forward.';
    if (isUserTurn.value) {
      if (solverLoading.value) {
        if (!solverStatus.value?.bookLoaded) return 'Loading opening book…';
        return 'Querying solver…';
      }
      if (suggestion.value?.col > 0) return 'Solver suggests a move.';
      if (solverError.value) return 'Solver unavailable — play freely.';
      return 'Play freely.';
    }
    return 'Place their move.';
  });

  const isReviewingHistory = computed(() => viewCursor.value < moveHistory.value.length);
  const canStepBack = computed(() => viewCursor.value > 0);
  const canStepForward = computed(() => viewCursor.value < moveHistory.value.length);
  const totalMoves = computed(() => moveHistory.value.length);

  /** Whether the full move history (regardless of viewCursor) contains a win */
  const gameHasWin = computed(
    () => checkForWin(constructBoardArr(moveHistory.value.join(''))) !== null,
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

  /** Running totals: each player accumulates the solver score of the column they picked */
  const runningTotals = computed(() => {
    let first = 0;
    let second = 0;
    const limit = viewCursor.value;
    for (let i = 0; i < limit; i++) {
      const s = moveScores.value[i];
      if (s == null) continue;
      if (i % 2 === 0)
        first += s; // move 0, 2, 4… = 1st player
      else second += s; // move 1, 3, 5… = 2nd player
    }
    return {first, second};
  });

  /* ── Display color mapping ──────────────────────────── */

  /** Map internal player (1=first mover, 2=second) to a display color hex string */
  function displayColorOf(internalPlayer) {
    if (internalPlayer === 0) return 'transparent';
    return internalPlayer === 1 ? color1.value : color2.value;
  }

  /* ── Actions ────────────────────────────────────────── */

  function makeMove(column) {
    if (winLine.value) return;
    const x = column - 1;
    if (x < 0 || x >= COLS) return;
    if (boardArr.value[ROWS - 1][x] !== 0) return;

    // If reviewing history, truncate future moves
    if (viewCursor.value < moveHistory.value.length) {
      moveHistory.value = moveHistory.value.slice(0, viewCursor.value);
      moveScores.value = moveScores.value.slice(0, viewCursor.value);
    }

    // Record the solver score for the chosen column (from current player's perspective)
    const colIndex = column - 1;
    const scoreForMove = solverScores.value ? solverScores.value[colIndex] : null;
    moveScores.value.push(scoreForMove !== -1000 ? scoreForMove : null);

    moveHistory.value.push(column);
    viewCursor.value = moveHistory.value.length;
    resetPending.value = false;

    saveState();
    syncUrl();
  }

  function makeAutoMove() {
    if (isUserTurn.value) return;
    if (winLine.value) return;

    // Use solver suggestion
    if (suggestion.value?.col > 0) {
      makeMove(suggestion.value.col);
    }
  }

  function stepBack() {
    if (viewCursor.value > 0) {
      const steps = autoEnabled.value ? 2 : 1;
      viewCursor.value = Math.max(0, viewCursor.value - steps);
      syncUrl();
    }
  }

  function stepForward() {
    if (viewCursor.value < moveHistory.value.length) {
      const steps = autoEnabled.value ? 2 : 1;
      viewCursor.value = Math.min(moveHistory.value.length, viewCursor.value + steps);
      syncUrl();
    }
  }

  function goToLatest() {
    viewCursor.value = moveHistory.value.length;
    syncUrl();
  }

  function resetBoard() {
    if (!resetPending.value) {
      resetPending.value = true;
      return;
    }
    moveHistory.value = [];
    moveScores.value = [];
    viewCursor.value = 0;
    resetPending.value = false;
    saveState();
    syncUrl();
  }

  function cancelReset() {
    resetPending.value = false;
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

  function swapColors() {
    const tmp = color1.value;
    color1.value = color2.value;
    color2.value = tmp;
    saveState();
  }

  function startReplay() {
    if (replayActive.value) return;
    stopReplay();
    replayActive.value = true;
    viewCursor.value = 0;
    replayInterval = setInterval(() => {
      if (viewCursor.value < moveHistory.value.length) {
        viewCursor.value++;
      } else {
        stopReplay();
      }
    }, 500);
  }

  function continueReplay() {
    if (replayActive.value) return;
    if (viewCursor.value >= moveHistory.value.length) return;
    replayActive.value = true;
    replayInterval = setInterval(() => {
      if (viewCursor.value < moveHistory.value.length) {
        viewCursor.value++;
      } else {
        stopReplay();
      }
    }, 500);
  }

  function stopReplay() {
    replayActive.value = false;
    clearInterval(replayInterval);
    replayInterval = null;
  }

  function toggleAuto() {
    autoEnabled.value = !autoEnabled.value;
    if (autoEnabled.value) {
      autoInterval = setInterval(() => {
        if (!isUserTurn.value && !winLine.value) {
          makeAutoMove();
        }
      }, 400);
    } else {
      clearInterval(autoInterval);
      autoInterval = null;
    }
  }

  /* ── Persistence ────────────────────────────────────── */

  function saveState() {
    try {
      localStorage.setItem(
        'c4_state',
        JSON.stringify({
          moves: moveHistory.value.join(''),
          userIsFirst: userIsFirst.value,
          color1: color1.value,
          color2: color2.value,
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
    autoEnabled,
    replayActive,
    loading,
    moveHistory,
    viewCursor,
    resetPending,
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
    suggestionText,
    suggestionLabel,
    solverStatusText,
    statusTitle,
    statusText,
    isReviewingHistory,
    canStepBack,
    canStepForward,
    totalMoves,
    gameHasWin,
    positionEval,
    runningTotals,
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
    setUserIsFirst,
    setColor1,
    setColor2,
    swapColors,
    toggleAuto,
    startReplay,
    continueReplay,
    stopReplay,
  };
});
