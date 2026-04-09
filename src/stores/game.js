import {ref, shallowRef, computed, watch} from 'vue';
import {defineStore} from 'pinia';

const ROWS = 6;
const COLS = 7;

/* ── Opening names ──────────────────────────────────────── */

const prefixList = [
  {'Two-bar': ['436766']},
  {'Bent two-bar': ['436761663']},
  {'Short Cup Opening': ['46213522']},
  {'Tall Cup Opening': ['46213524224']},
  {'No Cup Opening': ['46213523']},
  {'6-1': ['4444445']},
  {47: ['47']},
  {426566: ['426566']},
  {426564: ['426564']},
  {'Shoulder Spike': ['44444521', '44444524']},
  {4444452: ['4444452']},
  {'True Candlesticks': ['44444222266']},
  {'Half Candlesticks': ['444442222', '444446622']},
  {'Crown Variations': ['44444']},
  {'D3-D4 Openings': ['4442', '4441']},
  {4363: ['4363']},
  {'Fist Variations': ['4366755535']},
  {'Palm Variations': ['436556766']},
  {4366: ['4366']},
  {Triline: ['4623272', '4623262']},
  {'Other 4367 Lines': ['4367']},
  {'3-2': ['4443673', '4443613']},
  {'Two-holes': ['4361']},
  {'Other 462 Lines': ['462']},
  {'Hills Opening': ['4443655', '4364455', '4365', '452443']},
  {'Very Beginning': ['']},
];

export {prefixList};

const PRIORITY_LABELS = {
  win: 'Winning move!',
  block: "Blocking opponent's win",
  urgent: 'Play on ! (urgent)',
  miai: 'Play on @ (miai) — exactly 1 available',
  claimeven: 'Claimeven — · (dot) on even row (2,4,6)',
  claimodd: 'Claimodd — | on odd row (1,3,5)',
  plus: 'Play on +',
  equal: 'Play on =',
  minus: 'Play on −',
};

/* ── Pure helpers ───────────────────────────────────────── */

function constructBoardArr(moveString) {
  const b = Array.from({length: ROWS}, () => new Array(COLS).fill(0));
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

function hashABoard(boardToHash, nodes) {
  let a = 1;
  let semihash = 0;
  for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < COLS; j++) {
      semihash += boardToHash[ROWS - 1 - i][j] * a;
      a *= 1.021813947;
    }
  }
  let closeDist = 0.00000001;
  let closeName = -1;
  for (const name in nodes) {
    const dist = Math.abs(semihash - name);
    if (dist < closeDist) {
      closeName = name;
      closeDist = dist;
    }
  }
  return closeName;
}

function invertAround4(str) {
  let result = '';
  for (const ch of str) {
    const d = 8 - (ch.charCodeAt(0) - 48); // '0' = 48
    result += String.fromCharCode(d + 48);
  }
  return result;
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

function checkFourInARow(board, x, y, player) {
  const dirs = [
    {dx: 1, dy: 0},
    {dx: 0, dy: 1},
    {dx: 1, dy: 1},
    {dx: 1, dy: -1},
  ];
  for (const {dx, dy} of dirs) {
    let count = 1;
    for (let sign = -1; sign <= 1; sign += 2) {
      for (let step = 1; step < 4; step++) {
        const nx = x + dx * step * sign;
        const ny = y + dy * step * sign;
        if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) break;
        if (board[ny][nx] !== player) break;
        count++;
      }
    }
    if (count >= 4) return true;
  }
  return false;
}

function decodePriority(c) {
  switch (String.fromCharCode(c)) {
    case '@':
      return 'miai';
    case ' ':
    case '.':
      return 'claimeven';
    case '|':
      return 'claimodd';
    case '+':
      return 'plus';
    case '=':
      return 'equal';
    case '-':
      return 'minus';
    case '1':
      return 'red';
    case '2':
      return 'yellow';
    case '!':
      return 'urgent';
    default:
      return null;
  }
}

function heuristicFallback(board, machinePlayer) {
  const opponent = machinePlayer === 1 ? 2 : 1;
  const b = board.map(row => [...row]);

  function getTop(x) {
    for (let y = 0; y < ROWS; y++) {
      if (b[y][x] === 0) return y;
    }
    return -1;
  }

  // 1. Win immediately
  for (let x = 0; x < COLS; x++) {
    const y = getTop(x);
    if (y === -1) continue;
    b[y][x] = machinePlayer;
    const won = checkFourInARow(b, x, y, machinePlayer);
    b[y][x] = 0;
    if (won) return x + 1;
  }

  // 2. Block opponent's win
  for (let x = 0; x < COLS; x++) {
    const y = getTop(x);
    if (y === -1) continue;
    b[y][x] = opponent;
    const won = checkFourInARow(b, x, y, opponent);
    b[y][x] = 0;
    if (won) return x + 1;
  }

  // 3. Score by own-line extension + center preference
  const dirs = [
    {dx: 1, dy: 0},
    {dx: 0, dy: 1},
    {dx: 1, dy: 1},
    {dx: 1, dy: -1},
  ];
  let bestCol = -1;
  let bestScore = -Infinity;
  for (let x = 0; x < COLS; x++) {
    const y = getTop(x);
    if (y === -1) continue;
    b[y][x] = machinePlayer;
    let score = 0;
    for (const {dx, dy} of dirs) {
      let fwd = 0;
      let bwd = 0;
      for (let s = 1; s < 4; s++) {
        const nx = x + dx * s;
        const ny = y + dy * s;
        if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS || b[ny][nx] !== machinePlayer) break;
        fwd++;
      }
      for (let s = 1; s < 4; s++) {
        const nx = x - dx * s;
        const ny = y - dy * s;
        if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS || b[ny][nx] !== machinePlayer) break;
        bwd++;
      }
      score += (fwd + bwd) ** 2;
    }
    b[y][x] = 0;
    score += (3 - Math.abs(x - 3)) * 0.5;
    if (score > bestScore) {
      bestScore = score;
      bestCol = x;
    }
  }
  return bestCol + 1;
}

function querySteadyState(bArr, ss) {
  const currentPlayer = 1; // SS diagrams are always for the first mover
  const opponent = 2;

  function getColumnTop(x) {
    for (let y = 0; y < ROWS; y++) {
      if (bArr[y][x] === 0) return y;
    }
    return -1;
  }

  function checkWin(board, x, player) {
    const y = getColumnTop(x);
    if (y === -1) return false;
    board[y][x] = player;
    const won = checkFourInARow(board, x, y, player);
    board[y][x] = 0;
    return won;
  }

  // 1. Instant wins
  for (let x = 0; x < COLS; x++) {
    if (getColumnTop(x) !== -1 && checkWin(bArr, x, currentPlayer)) {
      return {col: x + 1, reason: 'win'};
    }
  }

  // 2. Block opponent
  for (let x = 0; x < COLS; x++) {
    if (getColumnTop(x) !== -1 && checkWin(bArr, x, opponent)) {
      return {col: x + 1, reason: 'block'};
    }
  }

  // 3–8. Priority-based steady-state rules
  const priorities = ['urgent', 'miai', 'claimeven', 'claimodd', 'plus', 'equal', 'minus'];
  for (const priority of priorities) {
    const validMoves = [];
    for (let x = 0; x < COLS; x++) {
      let y = getColumnTop(x);
      if (y === -1) continue;
      y = 5 - y;
      const ch = ss[y][x];
      if (decodePriority(ch) === priority) {
        if (priority === 'miai') {
          validMoves.push(x);
          if (validMoves.length > 1) break;
        } else if (priority === 'claimeven') {
          if (y % 2 === 0) return {col: x + 1, reason: 'claimeven'};
        } else if (priority === 'claimodd') {
          if (y % 2 === 1) return {col: x + 1, reason: 'claimodd'};
        } else {
          return {col: x + 1, reason: priority};
        }
      }
    }
    if (priority === 'miai' && validMoves.length === 1) {
      return {col: validMoves[0] + 1, reason: 'miai'};
    }
  }

  return {col: -4, reason: null};
}

/* ── Strong solver API (connect4.gamesolver.org) ───────── */

const solverCache = new Map();

async function queryStrongSolver(moveString) {
  if (solverCache.has(moveString)) {
    return solverCache.get(moveString);
  }
  const url = `https://connect4.gamesolver.org/solve?pos=${encodeURIComponent(moveString)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Solver returned ${response.status}`);
  const data = await response.json();
  solverCache.set(moveString, data.score);
  return data.score;
}

function interpretScores(scores) {
  let bestCol = -1;
  let bestScore = -Infinity;
  for (let i = 0; i < 7; i++) {
    if (scores[i] === 100) continue; // column full
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
  const nodes = shallowRef({});
  const userIsFirst = ref(true); // does the human play as the first mover?
  const color1 = ref('#e03030'); // display color for the first player
  const color2 = ref('#e8d020'); // display color for the second player
  const autoEnabled = ref(false);
  const loading = ref(true);
  const moveHistory = ref([]); // array of column numbers (1-7)
  const viewCursor = ref(0); // how many moves are currently displayed (0 = start)
  const resetPending = ref(false); // true when waiting for confirm

  // Solver API state
  const apiSuggestion = ref(null);
  const apiScores = ref(null);
  const apiLoading = ref(false);
  const apiError = ref(null);

  let autoInterval = null;
  let initialized = false;
  let rootNodeHash = 0;

  /* ── Derived ────────────────────────────────────────── */

  /** The move string up to the current cursor position */
  const repstr = computed(() => moveHistory.value.slice(0, viewCursor.value).join(''));

  /** Recompute hash + extraMoves by replaying moves up to cursor */
  const hashState = computed(() => {
    let h = rootNodeHash;
    let extra = '';
    const n = nodes.value;
    for (let i = 0; i < viewCursor.value; i++) {
      const moveStr = moveHistory.value.slice(0, i + 1).join('');
      const board = constructBoardArr(moveStr);
      const newHash = hashABoard(board, n);
      if (newHash !== -1) {
        h = newHash;
        extra = '';
      } else {
        extra += moveHistory.value[i];
      }
    }
    return {hash: h, extra};
  });

  const hash = computed(() => hashState.value.hash);
  const extraMoves = computed(() => hashState.value.extra);

  const boardArr = computed(() => constructBoardArr(repstr.value));

  const winLine = computed(() => checkForWin(boardArr.value));

  const turnLength = computed(() => repstr.value.length);

  /** Internal player number whose turn it is: 1 = first mover, 2 = second mover */
  const internalCurrentPlayer = computed(() => (turnLength.value % 2 === 0 ? 1 : 2));

  const isUserTurn = computed(() => (internalCurrentPlayer.value === 1) === userIsFirst.value);

  /** Display label for whose turn it is */
  const currentPlayerLabel = computed(() => (isUserTurn.value ? 'You' : 'Opponent'));

  const inSteadyState = computed(() => {
    const node = nodes.value[hash.value];
    return extraMoves.value !== '' || (node && !node.neighbors);
  });

  /** Detect if the first mover deviated from solution at any point up to cursor */
  const ssBroken = computed(() => {
    const n = nodes.value;
    let h = rootNodeHash;
    let extra = '';
    let enteredSS = false;
    for (let i = 0; i < viewCursor.value; i++) {
      const isP1Turn = i % 2 === 0;
      const node = n[h];
      enteredSS = enteredSS || extra !== '' || (node && !node.neighbors);

      // Only check first-mover turns in steady state
      if (isP1Turn && enteredSS && node?.data?.ss) {
        const board = constructBoardArr(moveHistory.value.slice(0, i).join(''));
        const expected = querySteadyState(board, node.data.ss);
        if (expected.col > 0 && expected.col !== moveHistory.value[i]) {
          return true;
        }
      }

      // Advance hash state
      const moveStr = moveHistory.value.slice(0, i + 1).join('');
      const board = constructBoardArr(moveStr);
      const newHash = hashABoard(board, n);
      if (newHash !== -1) {
        h = newHash;
        extra = '';
      } else {
        extra += moveHistory.value[i];
      }
    }
    return false;
  });

  /** Detect if the first mover (opponent when user is 2nd) deviated */
  const opponentDeviated = computed(() => {
    if (userIsFirst.value) return false; // only relevant when user is 2nd player
    const n = nodes.value;
    let h = rootNodeHash;
    let extra = '';
    for (let i = 0; i < viewCursor.value; i++) {
      const isP1Turn = i % 2 === 0;
      const node = n[h];
      const inSS = extra !== '' || (node && !node.neighbors);

      if (isP1Turn) {
        // Check opening tree
        if (!inSS && node?.neighbors) {
          // Find expected move
          for (const nbHash of node.neighbors) {
            const nb = n[nbHash];
            if (nb && nb.rep.length > node.rep.length) {
              const oldBoard = constructBoardArr(node.rep);
              const newBoard = constructBoardArr(nb.rep);
              for (let c = 0; c < COLS; c++) {
                for (let r = 0; r < ROWS; r++) {
                  if (oldBoard[r][c] !== newBoard[r][c]) {
                    if (moveHistory.value[i] !== c + 1) return i + 1; // move number where deviation happened
                  }
                }
              }
            }
          }
        }
        // Check steady state
        if (inSS && node?.data?.ss) {
          const board = constructBoardArr(moveHistory.value.slice(0, i).join(''));
          const expected = querySteadyState(board, node.data.ss);
          if (expected.col > 0 && expected.col !== moveHistory.value[i]) return i + 1;
        }
      }

      // Advance hash state
      const moveStr = moveHistory.value.slice(0, i + 1).join('');
      const board = constructBoardArr(moveStr);
      const newHash = hashABoard(board, n);
      if (newHash !== -1) {
        h = newHash;
        extra = '';
      } else {
        extra += moveHistory.value[i];
      }
    }
    return false;
  });

  const openingName = computed(() => {
    const node = nodes.value[hash.value];
    return node?.prefix ?? '—';
  });

  const ssData = computed(() => {
    const node = nodes.value[hash.value];
    return node?.data?.ss ?? null;
  });

  const suggestion = computed(() => {
    if (winLine.value) return null;
    if (turnLength.value % 2 !== 0) return null; // solution data is only for the first mover
    if (ssBroken.value && inSteadyState.value) return null; // SS invalid after deviation
    const node = nodes.value[hash.value];

    // Only show when viewing the latest move (not reviewing history)
    if (viewCursor.value < moveHistory.value.length) return null;

    // 1. Opening tree suggestion
    if (!inSteadyState.value && node?.neighbors) {
      for (const nbHash of node.neighbors) {
        const nb = nodes.value[nbHash];
        if (nb && nb.rep.length > node.rep.length) {
          const oldBoard = constructBoardArr(node.rep);
          const newBoard = constructBoardArr(nb.rep);
          for (let c = 0; c < COLS; c++) {
            for (let r = 0; r < ROWS; r++) {
              if (oldBoard[r][c] !== newBoard[r][c]) {
                return {col: c + 1, reason: 'Opening book move'};
              }
            }
          }
        }
      }
    }

    // 2. Steady-state fallback
    if (node?.data?.ss) {
      const result = querySteadyState(boardArr.value, node.data.ss);
      if (result.col !== -4) return result;
    }

    return null;
  });

  /* ── Solver API watcher ─────────────────────────────── */

  const bestSuggestion = computed(() => {
    if (suggestion.value?.col > 0) {
      return {...suggestion.value, source: 'weak'};
    }
    if (apiSuggestion.value?.col > 0) {
      return apiSuggestion.value;
    }
    return null;
  });

  watch(
    [repstr, suggestion, viewCursor, moveHistory, winLine, loading],
    async ([pos, weakSug, cursor, history, win, isLoading]) => {
      apiSuggestion.value = null;
      apiScores.value = null;
      apiError.value = null;
      apiLoading.value = false;

      if (isLoading || win || cursor < history.length) return;
      if (weakSug?.col > 0) return;
      if (pos === '' && turnLength.value === 0) return; // nothing to query at start

      apiLoading.value = true;
      const queryPos = pos;
      try {
        const scores = await queryStrongSolver(queryPos);
        if (repstr.value !== queryPos) return; // stale
        apiScores.value = scores;
        apiSuggestion.value = interpretScores(scores);
      } catch (e) {
        if (repstr.value === queryPos) apiError.value = e.message;
      } finally {
        if (repstr.value === queryPos) apiLoading.value = false;
      }
    },
    {immediate: true},
  );

  const suggestionLabel = computed(() => {
    const sug = bestSuggestion.value;
    if (!sug || sug.col <= 0) return '';
    return PRIORITY_LABELS[sug.reason] || sug.reason;
  });

  const statusTitle = computed(() => {
    if (winLine.value) {
      const winnerInternal = boardArr.value[winLine.value[0][0]][winLine.value[0][1]];
      const isFirstMoverWin = winnerInternal === 1;
      if (isFirstMoverWin === userIsFirst.value) return 'You win!';
      return 'Opponent wins!';
    }
    return isUserTurn.value ? 'Your turn' : "Opponent's turn";
  });

  const statusText = computed(() => {
    if (winLine.value) return 'Press Reset to start over.';
    if (viewCursor.value < moveHistory.value.length)
      return 'Reviewing history — use ▶ to step forward.';
    if (ssBroken.value && inSteadyState.value && isUserTurn.value && !apiSuggestion.value) {
      return 'You deviated from the solution — querying solver…';
    }
    if (opponentDeviated.value) {
      return `Opponent deviated at move ${opponentDeviated.value} — they left optimal play!`;
    }
    if (isUserTurn.value) {
      if (apiLoading.value) return 'Querying solver…';
      if (bestSuggestion.value?.col > 0) {
        if (bestSuggestion.value.source === 'solver') {
          return 'Solver suggests a move.';
        }
        return inSteadyState.value
          ? 'Check the suggested move.'
          : 'Follow the opening or play freely.';
      }
      if (apiError.value) return 'Solver unavailable — play freely.';
      return 'Play freely.';
    }
    return 'Place their move.';
  });

  const isReviewingHistory = computed(() => viewCursor.value < moveHistory.value.length);
  const canStepBack = computed(() => viewCursor.value > 0);
  const canStepForward = computed(() => viewCursor.value < moveHistory.value.length);
  const totalMoves = computed(() => moveHistory.value.length);

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
    }

    moveHistory.value.push(column);
    viewCursor.value = moveHistory.value.length;
    resetPending.value = false;

    saveState();
    syncUrl();
  }

  function makeAutoMove() {
    if (isUserTurn.value) return;
    if (winLine.value) return;

    const isFirstMoverTurn = turnLength.value % 2 === 0;

    // First mover follows the solution (opening tree + steady state)
    if (isFirstMoverTurn) {
      const thisHash = hashABoard(boardArr.value, nodes.value);
      if (nodes.value[thisHash]?.neighbors) {
        for (const nbHash of nodes.value[thisHash].neighbors) {
          const nb = nodes.value[nbHash];
          if (nb && nb.rep.length > nodes.value[thisHash].rep.length) {
            const oldBoard = constructBoardArr(nodes.value[thisHash].rep);
            const newBoard = constructBoardArr(nb.rep);
            for (let c = 0; c < COLS; c++) {
              for (let r = 0; r < ROWS; r++) {
                if (oldBoard[r][c] !== newBoard[r][c]) {
                  makeMove(c + 1);
                  return;
                }
              }
            }
          }
        }
      }

      const node = nodes.value[hash.value];
      if (node?.data?.ss) {
        const result = querySteadyState(boardArr.value, node.data.ss);
        if (result.col > 0) {
          makeMove(result.col);
          return;
        }
      }
    }

    // Solver API fallback
    if (apiSuggestion.value?.col > 0) {
      makeMove(apiSuggestion.value.col);
      return;
    }

    // Heuristic fallback for second mover or when solution has no move
    const internalPlayer = isFirstMoverTurn ? 1 : 2;
    const col = heuristicFallback(boardArr.value, internalPlayer);
    if (col > 0) makeMove(col);
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

  /* ── Prefix assignment ──────────────────────────────── */

  function setPrefixes(nodesObj) {
    for (const dict of prefixList) {
      const pref = Object.keys(dict)[0];
      const seqList = dict[pref];
      for (const half of seqList) {
        for (const prefix of [half, invertAround4(half)]) {
          const h = hashABoard(constructBoardArr(prefix), nodesObj);
          if (h === -1) continue;
          const stack = [h];
          while (stack.length > 0) {
            const cur = stack.pop();
            if (!nodesObj[cur]) continue;
            if (nodesObj[cur].prefix) continue;
            nodesObj[cur].prefix = pref;
            if (!nodesObj[cur].neighbors) continue;
            for (const nb of nodesObj[cur].neighbors) {
              if (nodesObj[nb] && !nodesObj[nb].prefix) stack.push(nb);
            }
          }
        }
      }
    }
  }

  /* ── Init ───────────────────────────────────────────── */

  async function init() {
    if (initialized) return;
    initialized = true;

    const response = await fetch('/data/c4_full.json');
    const dataset = await response.json();

    // Build nodes as a plain object (no Vue reactivity overhead)
    const nodesRaw = dataset.nodes_to_use;
    const built = {};
    for (const name in nodesRaw) {
      const n = nodesRaw[name];
      built[name] = {
        data: n.data,
        neighbors: n.neighbors,
        rep: n.rep,
        prefix: null,
      };
    }

    // Run prefix assignment on the plain object
    setPrefixes(built);

    // Assign to reactive state once, all at once
    nodes.value = built;
    rootNodeHash = dataset.root_node_hash;
    moveHistory.value = [];
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
  }

  return {
    // Constants
    ROWS,
    COLS,
    // State
    nodes,
    hash,
    userIsFirst,
    color1,
    color2,
    autoEnabled,
    loading,
    ssBroken,
    moveHistory,
    viewCursor,
    resetPending,
    // Solver API
    apiSuggestion,
    apiScores,
    apiLoading,
    apiError,
    // Computed
    repstr,
    boardArr,
    winLine,
    internalCurrentPlayer,
    currentPlayerLabel,
    isUserTurn,
    inSteadyState,
    openingName,
    ssData,
    suggestion,
    bestSuggestion,
    suggestionLabel,
    statusTitle,
    statusText,
    isReviewingHistory,
    canStepBack,
    canStepForward,
    totalMoves,
    opponentDeviated,
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
    toggleAuto,
  };
});
