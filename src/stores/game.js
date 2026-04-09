import {ref, shallowRef, computed} from 'vue';
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

function constructBoardArr(moveString, firstPlayer) {
  const b = Array.from({length: ROWS}, () => new Array(COLS).fill(0));
  for (let i = 0; i < moveString.length; i++) {
    const x = moveString.charCodeAt(i) - 49; // '1' = 49
    for (let y = 0; y < ROWS; y++) {
      if (b[y][x] === 0) {
        b[y][x] = playerAtTurn(i, firstPlayer);
        break;
      }
    }
  }
  return b;
}

function playerAtTurn(turnIndex, firstPlayer) {
  return turnIndex % 2 === 0 ? firstPlayer : firstPlayer === 1 ? 2 : 1;
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

function querySteadyState(bArr, ss, currentPlayer) {
  currentPlayer = currentPlayer || 1;
  const opponent = currentPlayer === 1 ? 2 : 1;

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

  // 3–8. Priority-based (Red only)
  if (currentPlayer === 1) {
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
  }

  return {col: -4, reason: null};
}

/* ── Store ──────────────────────────────────────────────── */

export const useGameStore = defineStore('game', () => {
  const nodes = shallowRef({});
  const hash = ref(0);
  const hashStack = ref([]);
  const extraMoves = ref('');
  const userColor = ref(2); // 1 = Red, 2 = Yellow
  const firstPlayer = ref(1); // who goes first
  const autoEnabled = ref(false);
  const loading = ref(true);

  let autoInterval = null;
  let initialized = false;
  let rootNodeHash = 0;

  /* ── Derived ────────────────────────────────────────── */

  const repstr = computed(() => {
    const node = nodes.value[hash.value];
    return node ? node.rep + extraMoves.value : extraMoves.value;
  });

  const boardArr = computed(() => constructBoardArr(repstr.value, firstPlayer.value));

  const winLine = computed(() => checkForWin(boardArr.value));

  const turnLength = computed(() => repstr.value.length);

  const currentPlayer = computed(() => playerAtTurn(turnLength.value, firstPlayer.value));

  const isUserTurn = computed(() => currentPlayer.value === userColor.value);

  const inSteadyState = computed(() => {
    const node = nodes.value[hash.value];
    return extraMoves.value !== '' || (node && !node.neighbors);
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
    const node = nodes.value[hash.value];

    // 1. Opening tree suggestion
    if (!inSteadyState.value && node?.neighbors) {
      for (const nbHash of node.neighbors) {
        const nb = nodes.value[nbHash];
        if (nb && nb.rep.length > node.rep.length) {
          const oldBoard = constructBoardArr(node.rep, firstPlayer.value);
          const newBoard = constructBoardArr(nb.rep, firstPlayer.value);
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
      const result = querySteadyState(boardArr.value, node.data.ss, currentPlayer.value);
      if (result.col !== -4) return result;
    }

    return null;
  });

  const suggestionLabel = computed(() => {
    if (!suggestion.value || suggestion.value.col <= 0) return '';
    return PRIORITY_LABELS[suggestion.value.reason] || suggestion.value.reason;
  });

  const statusTitle = computed(() => {
    if (winLine.value) {
      const winner = boardArr.value[winLine.value[0][0]][winLine.value[0][1]];
      return winner === 1 ? 'Red wins!' : 'Yellow wins!';
    }
    return `${currentPlayer.value === 1 ? 'Red' : 'Yellow'} to move`;
  });

  const statusText = computed(() => {
    if (winLine.value) return 'Press Reset or R to start over.';
    if (isUserTurn.value) {
      return inSteadyState.value
        ? 'Your turn — check the suggested move.'
        : 'Your turn — follow the opening or play freely.';
    }
    return "Opponent's turn — place their move.";
  });

  const boardFooterText = computed(() => {
    return inSteadyState.value && !winLine.value
      ? 'Steady-state active — markers on the board show priorities.'
      : 'Steady-state inactive — follow the opening tree or play freely.';
  });

  /* ── Actions ────────────────────────────────────────── */

  function makeMove(column) {
    if (winLine.value) return;
    const x = column - 1;
    if (x < 0 || x >= COLS) return;
    if (boardArr.value[ROWS - 1][x] !== 0) return;

    hashStack.value.push({hash: hash.value, extra: extraMoves.value});

    const moveStr = repstr.value + column;
    const newBoard = constructBoardArr(moveStr, firstPlayer.value);
    const newHash = hashABoard(newBoard, nodes.value);

    if (newHash !== -1) {
      hash.value = newHash;
      extraMoves.value = '';
    } else {
      extraMoves.value += column;
    }

    saveState();
    syncUrl();
  }

  function makeAutoMove() {
    if (currentPlayer.value === userColor.value) return;
    if (winLine.value) return;

    const thisHash = hashABoard(boardArr.value, nodes.value);
    if (nodes.value[thisHash]?.neighbors) {
      for (const nbHash of nodes.value[thisHash].neighbors) {
        const nb = nodes.value[nbHash];
        if (nb && nb.rep.length > nodes.value[thisHash].rep.length) {
          const oldBoard = constructBoardArr(nodes.value[thisHash].rep, firstPlayer.value);
          const newBoard = constructBoardArr(nb.rep, firstPlayer.value);
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
      const result = querySteadyState(boardArr.value, node.data.ss, currentPlayer.value);
      if (result.col > 0) makeMove(result.col);
    }
  }

  function undo() {
    if (hashStack.value.length > 0) {
      const prev = hashStack.value.pop();
      hash.value = prev.hash;
      extraMoves.value = prev.extra;
      saveState();
      syncUrl();
    }
  }

  function resetBoard() {
    hash.value = rootNodeHash;
    hashStack.value = [];
    extraMoves.value = '';
    saveState();
    syncUrl();
  }

  function setUserColor(color) {
    userColor.value = color;
    saveState();
  }

  function setFirstPlayer(fp) {
    firstPlayer.value = fp;
    saveState();
  }

  function toggleAuto() {
    autoEnabled.value = !autoEnabled.value;
    if (autoEnabled.value) {
      autoInterval = setInterval(() => {
        if (currentPlayer.value !== userColor.value && !winLine.value) {
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
          moves: repstr.value,
          userColor: userColor.value,
          firstPlayer: firstPlayer.value,
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
          const h = hashABoard(constructBoardArr(prefix, firstPlayer.value), nodesObj);
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
    hash.value = rootNodeHash;
    hashStack.value = [];
    extraMoves.value = '';

    // Check URL for position, then fall back to saved state
    const urlParams = new URLSearchParams(window.location.search);
    const urlPos = urlParams.get('pos');
    const saved = loadState();

    const restoreMoves = urlPos || saved?.moves || '';

    if (saved) {
      if (saved.firstPlayer === 1 || saved.firstPlayer === 2) firstPlayer.value = saved.firstPlayer;
      if (saved.userColor === 1 || saved.userColor === 2) userColor.value = saved.userColor;
    }

    // Replay moves
    if (restoreMoves) {
      for (let i = 0; i < restoreMoves.length; i++) {
        const col = parseInt(restoreMoves[i]);
        if (col >= 1 && col <= 7) {
          const currentBoard = constructBoardArr(repstr.value, firstPlayer.value);
          const x = col - 1;
          if (currentBoard[ROWS - 1][x] === 0 && !checkForWin(currentBoard)) {
            hashStack.value.push({hash: hash.value, extra: extraMoves.value});
            const moveStr = repstr.value + col;
            const newBoard = constructBoardArr(moveStr, firstPlayer.value);
            const newHash = hashABoard(newBoard, nodes.value);
            if (newHash !== -1) {
              hash.value = newHash;
              extraMoves.value = '';
            } else {
              extraMoves.value += col;
            }
          }
        }
      }
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
    userColor,
    firstPlayer,
    autoEnabled,
    loading,
    // Computed
    repstr,
    boardArr,
    winLine,
    currentPlayer,
    isUserTurn,
    inSteadyState,
    openingName,
    ssData,
    suggestion,
    suggestionLabel,
    statusTitle,
    statusText,
    boardFooterText,
    // Actions
    init,
    makeMove,
    undo,
    resetBoard,
    setUserColor,
    setFirstPlayer,
    toggleAuto,
  };
});
