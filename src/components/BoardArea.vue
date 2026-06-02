<!--
  Copyright (C) Pascal Pons (https://github.com/PascalPons/connect4)
  Copyright (C) 2026 Khodok

  This file is part of Connect4 Game Solver.

  Connect4 Game Solver is free software: you can redistribute it and/or
  modify it under the terms of the GNU Affero General Public License as
  published by the Free Software Foundation, either version 3 of the
  License, or (at your option) any later version.

  Connect4 Game Solver is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with Connect4 Game Solver. If not, see <http://www.gnu.org/licenses/>.
-->

<template>
  <section class="board-area" aria-label="Game board and controls">
    <div class="board-grid">
      <div class="column-buttons">
        <div
          v-for="(s, i) in game.solverScores ?? Array(7).fill(-1000)"
          :key="i"
          class="score-cell"
          :class="scoreClass(s)"
        >
          {{ s === -1000 ? '—' : s > 0 ? `+${s}` : s }}
        </div>

        <button
          v-for="c in game.COLS"
          :key="c"
          class="col-header"
          :class="{
            suggested: isSuggested(c),
            disabled: game.boardArr[game.ROWS - 1][c - 1] !== 0 || !!game.winLine,
          }"
          :disabled="game.boardArr[game.ROWS - 1][c - 1] !== 0 || !!game.winLine"
          :aria-label="getColumnAriaLabel(c)"
          :style="
            isSuggested(c)
              ? {
                  '--player-color': game.displayColorOf(game.internalCurrentPlayer),
                }
              : {}
          "
          @click="game.makeMove(c)"
        >
          {{ c }}
        </button>
      </div>

      <div class="row-labels">
        <div v-for="vr in game.ROWS" :key="vr" class="row-label">{{ game.ROWS - vr + 1 }}</div>
      </div>

      <div class="board" role="grid" aria-label="Game board">
        <div v-for="vr in game.ROWS" :key="vr" class="board-row" role="row">
          <div
            v-for="c in game.COLS"
            :key="`${vr}-${c}`"
            class="cell"
            role="gridcell"
            :style="cellStyle(game.ROWS - vr, c - 1)"
            :class="{
              winning: isWinningCell(game.ROWS - vr, c - 1),
              'last-move': isLastMove(game.ROWS - vr, c - 1),
              ghost: !!getGhost(game.ROWS - vr, c - 1),
              'next-ghost': getGhost(game.ROWS - vr, c - 1)?.step === 1,
            }"
            :aria-label="getCellAriaLabel(game.ROWS - vr, c - 1)"
            tabindex="-1"
            @click="game.makeMove(c)"
          >
            <span v-if="getGhost(game.ROWS - vr, c - 1)" class="ghost-step" aria-hidden="true">
              {{ getGhost(game.ROWS - vr, c - 1).step }}
            </span>
          </div>
        </div>
      </div>

      <div class="player-indicators">
        <div class="player-info-row">
          <div class="player-info">
            <span :style="{color: `oklch(from ${game.color1} max(0.65, l) c h)`}">P1</span>
            <span
              v-if="!game.hideEvalBar"
              class="eval-score"
              :class="evalClass(game.positionEval?.first)"
            >
              {{ formatEval(game.positionEval?.first) }}
            </span>
          </div>

          <button
            class="status-label"
            :class="{
              active: game.showGhostMoves && !isGameOver,
              placeholder: isPlaceholder,
              'game-over': isGameOver,
              'win-position': !!game.winLine,
            }"
            :style="{color: statusColor}"
            :disabled="isGameOver || isPlaceholder"
            :aria-label="statusAriaLabel"
            :title="
              !isGameOver && statusLabel !== null
                ? 'Click to toggle predictive future moves'
                : undefined
            "
            @click="handleStatusClick"
          >
            {{ displayLabel }}
          </button>

          <div class="player-info">
            <span
              v-if="!game.hideEvalBar"
              class="eval-score"
              :class="evalClass(game.positionEval?.second)"
            >
              {{ formatEval(game.positionEval?.second) }}
            </span>
            <span :style="{color: `oklch(from ${game.color2} max(0.65, l) c h)`}">P2</span>
          </div>

          <button
            v-if="!game.hideAutoplay"
            class="auto-btn auto-p1-btn"
            :class="{active: game.autoP1}"
            :style="{
              '--player-accent': game.color1,
            }"
            :aria-pressed="game.autoP1"
            title="Auto-play Player 1's moves"
            @click="game.toggleAutoP1()"
          >
            Auto
          </button>

          <button
            v-if="!game.hideAutoplay"
            class="auto-both-btn"
            :class="{active: game.autoP1 && game.autoP2}"
            :aria-pressed="game.autoP1 && game.autoP2"
            title="Auto-play both players' moves"
            @click="game.toggleAutoBoth()"
          >
            Auto both
          </button>

          <button
            v-if="!game.hideAutoplay"
            class="auto-btn auto-p2-btn"
            :class="{active: game.autoP2}"
            :style="{
              '--player-accent': game.color2,
            }"
            :aria-pressed="game.autoP2"
            title="Auto-play Player 2's moves"
            @click="game.toggleAutoP2()"
          >
            Auto
          </button>
        </div>

        <meter
          v-if="!game.hideEvalBar"
          class="eval-meter"
          :style="{
            '--winning-color':
              (game.positionEval?.first ?? 0) > 0
                ? game.color1
                : (game.positionEval?.first ?? 0) < 0
                  ? game.color2
                  : 'var(--color-text-dim)',
          }"
          :min="0"
          :max="100"
          :low="49"
          :optimum="50"
          :high="51"
          :value="50 - ((game.positionEval?.first ?? 0) / 21) * 50"
        ></meter>
      </div>
    </div>
  </section>
</template>

<script setup>
import {computed} from 'vue';
import {useGameStore} from '@/stores/game';

const game = useGameStore();

const statusLabel = computed(() => {
  if (game.resignedPlayer !== 0) return `Player ${game.resignedPlayer} resigned`;
  if (game.isDraw) return 'Draw';
  const score = game.suggestion?.score;
  if (score == null) return null;
  if (score === 0) return 'Draw';
  const k = game.viewCursor;
  const m = score > 0 ? 43 + (k % 2) - k - 2 * score : 44 - (k % 2) - k + 2 * score;
  const winner = score > 0 ? game.internalCurrentPlayer : game.internalCurrentPlayer === 1 ? 2 : 1;
  return `P${winner} wins in ${m}`;
});

const statusColor = computed(() => {
  if (game.winLine) {
    const color = game.internalCurrentPlayer === 2 ? game.color1 : game.color2;
    return `oklch(from ${color} max(0.65, l) c h)`;
  }
  const score = game.suggestion?.score;
  if (score == null || score === 0) return 'var(--color-text-dim)';
  const winner = score > 0 ? game.internalCurrentPlayer : game.internalCurrentPlayer === 1 ? 2 : 1;
  const color = winner === 1 ? game.color1 : game.color2;
  return `oklch(from ${color} max(0.65, l) c h)`;
});

const isGameOver = computed(() => game.gameOver);

const isPlaceholder = computed(() => !game.winLine && statusLabel.value === null);

const displayLabel = computed(() => {
  if (game.winLine) {
    const winner = game.internalCurrentPlayer === 2 ? 1 : 2;
    return `P${winner} Winner`;
  }
  return statusLabel.value ?? ' ';
});

function handleStatusClick() {
  if (!isGameOver.value && statusLabel.value !== null) game.toggleGhostMoves();
}

const ghostCellsMap = computed(() => {
  const map = {};
  for (const gc of game.ghostCells) {
    map[`${gc.row}-${gc.col}`] = gc;
  }
  return map;
});

function getGhost(row, col) {
  return ghostCellsMap.value[`${row}-${col}`] || null;
}

function isSuggested(col) {
  if (!game.repstr.length) return col === 4;
  return (
    game.suggestion?.bestCols?.includes(col) &&
    game.boardArr[game.ROWS - 1][col - 1] === 0 &&
    !game.winLine
  );
}

function cellStyle(row, col) {
  const p = game.boardArr[row][col];
  if (p !== 0) {
    const color = game.displayColorOf(p);
    return {
      backgroundColor: color,
      boxShadow: `0 0 12px ${color}40`,
      '--glow': color,
    };
  }

  const ghost = getGhost(row, col);
  if (ghost) {
    const color = game.displayColorOf(ghost.player);
    return {
      '--ghost-color': color,
    };
  }

  return {};
}

function isWinningCell(row, col) {
  return game.winLine?.some(([wy, wx]) => wy === row && wx === col) ?? false;
}

function isLastMove(row, col) {
  const pos = game.repstr;
  if (!pos.length) return false;
  const lastCol = pos.charCodeAt(pos.length - 1) - 49;
  if (col !== lastCol) return false;
  // find the topmost filled row in that column
  for (let y = game.ROWS - 1; y >= 0; y--) {
    if (game.boardArr[y][lastCol] !== 0) return y === row;
  }
  return false;
}

function scoreClass(score) {
  if (score === -1000) return 'disabled';
  if (score > 0) return 'score-win';
  if (score === 0) return 'score-draw';
  return 'score-loss';
}

function evalClass(score) {
  score = score ?? 0;
  if (score > 0) return 'eval-win';
  if (score === 0) return 'eval-draw';
  return 'eval-loss';
}

function formatEval(score) {
  score = score ?? 0;
  if (score > 0) return `+${score}`;
  if (score === 0) return '0';
  return `${score}`;
}

function getColumnAriaLabel(col) {
  const isFull = game.boardArr[game.ROWS - 1][col - 1] !== 0;
  if (isFull) {
    return `Column ${col} (Full)`;
  }
  if (game.winLine) {
    return `Column ${col} (Game over)`;
  }
  const score = game.solverScores?.[col - 1];
  let scoreText = '';
  if (score !== undefined && score !== null && score !== -1000) {
    if (score > 0) {
      scoreText = `. Score +${score} (winning position)`;
    } else if (score < 0) {
      scoreText = `. Score ${score} (losing position)`;
    } else {
      scoreText = `. Score 0 (draw position)`;
    }
  }
  const isOptimal = isSuggested(col);
  const optimalText = isOptimal ? '. Recommended move' : '';
  return `Column ${col}${scoreText}${optimalText}`;
}

function getCellAriaLabel(row, col) {
  const cellValue = game.boardArr[row][col];
  const visualRow = row + 1;
  const colLabel = col + 1;

  let contentText = 'Empty';
  if (cellValue === 1) {
    contentText = 'Player 1 checker';
  } else if (cellValue === 2) {
    contentText = 'Player 2 checker';
  } else {
    const ghost = getGhost(row, col);
    if (ghost) {
      contentText = `Ghost predictive move step ${ghost.step} for Player ${ghost.player}`;
    }
  }

  if (isWinningCell(row, col)) {
    contentText += ' (Winning checker)';
  } else if (isLastMove(row, col)) {
    contentText += ' (Last move)';
  }

  return `Row ${visualRow}, Column ${colLabel}: ${contentText}`;
}

const statusAriaLabel = computed(() => {
  if (isPlaceholder.value) return '';
  if (isGameOver.value) {
    return `Game outcome: ${displayLabel.value}`;
  }
  return `Game status: ${displayLabel.value}. Click to toggle predictive future moves. Currently ${game.showGhostMoves ? 'enabled' : 'disabled'}`;
});
</script>

<style scoped>
.board-area {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  align-items: center;
  max-inline-size: 100%;
}

.board-grid {
  display: grid;
  grid-template-rows: auto max-content;
  grid-template-columns: max-content max-content;
  max-inline-size: 100%;
  margin-inline: auto;
  padding-bottom: 0.5rem;
  overflow-x: auto;
  gap: var(--board-gap);
}

.column-buttons {
  display: grid;
  grid-template-columns: repeat(7, var(--cell-size));
  grid-column: 2;
  padding-inline: var(--board-gap);
  gap: var(--board-gap);
  font-size: 0.85rem;
}

.row-labels {
  display: grid;
  grid-template-rows: repeat(6, var(--cell-size));
  grid-row: 2;
  grid-column: 1;
  align-items: center;
  padding-inline-end: 6px;
  padding-block: var(--board-gap);
  gap: var(--board-gap);
}

.board {
  display: flex;
  grid-row: 2;
  grid-column: 2;
  flex-direction: column;
  padding: var(--board-gap);
  gap: var(--board-gap);
  border-radius: calc(var(--board-gap) + var(--cell-size) / 2);
  background-color: oklch(0.3 0.1 250);
}

.board-row {
  display: flex;
  flex-direction: row;
  gap: var(--board-gap);
}

.player-indicators {
  display: flex;
  grid-column: 2;
  flex-direction: column;
  inline-size: 100%;
  gap: 0.5rem;
  font-size: small;
}

.player-info-row {
  display: grid;
  grid-template-rows: auto auto;
  grid-template-columns: 1fr auto 1fr;
  row-gap: 4px;
  align-items: start;
  inline-size: 100%;
}

.player-info-row > .player-info:first-child {
  grid-row: 1;
  grid-column: 1;
  justify-self: start;
}

.player-info-row > .status-label {
  grid-row: 1;
  grid-column: 2;
  justify-self: center;
}

.player-info-row > .player-info:nth-child(3) {
  grid-row: 1;
  grid-column: 3;
  justify-self: end;
}

.player-info-row > .auto-p1-btn {
  grid-row: 2;
  grid-column: 1;
  justify-self: start;
}

.player-info-row > .auto-both-btn {
  grid-row: 2;
  grid-column: 2;
  justify-self: center;
}

.player-info-row > .auto-p2-btn {
  grid-row: 2;
  grid-column: 3;
  justify-self: end;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.auto-btn {
  padding: 8px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
  color: var(--color-text-dim);
  font-weight: 500;
  font-size: 0.7rem;
  cursor: pointer;
  transition:
    color 0.15s,
    border-color 0.15s,
    background-color 0.15s;

  &:hover {
    border-color: var(--player-accent);
    color: var(--color-text);
  }

  &.active {
    border-color: var(--player-accent);
    background-color: var(--player-accent);
    color: oklch(from var(--player-accent) clamp(0.15, (0.5 - l) * 10000, 0.95) c h);
  }
}

.auto-both-btn {
  padding: 8px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
  color: var(--color-text-dim);
  font-weight: 500;
  font-size: 0.7rem;
  white-space: nowrap;
  cursor: pointer;
  transition:
    color 0.15s,
    border-color 0.15s,
    background-color 0.15s;

  &:hover {
    border-color: var(--color-text);
    color: var(--color-text);
  }

  &.active {
    border-color: var(--color-text);
    background-color: var(--color-text);
    color: var(--color-surface);
  }
}

.status-label {
  padding: 4px 10px;
  border: 1px dashed transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 600;
  font-size: 0.85rem;
  text-align: center;
  white-space: nowrap;
  cursor: default;
  transition:
    background-color 0.15s,
    border-color 0.15s,
    color 0.15s;

  &:disabled {
    border-color: transparent;
    cursor: default;
  }

  &:not(:disabled) {
    cursor: pointer;

    &:hover {
      border-color: currentColor;
      background-color: var(--color-surface-alt);
    }

    &.active {
      border-style: solid;
      border-color: currentColor;
      background-color: var(--color-surface-alt);
    }
  }

  &.win-position {
    font-weight: 700;
    text-transform: uppercase;
  }

  &.placeholder {
    visibility: hidden;
    pointer-events: none;
  }
}

.col-header {
  padding: 4px 2px;
  border: none;
  border-radius: var(--radius-sm);
  background-color: var(--color-surface-alt);
  color: var(--color-text-dim);
  font: inherit;
  font-weight: 600;
  text-align: center;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.3;
  }

  &.suggested {
    background-color: var(--player-color);
    color: oklch(from var(--player-color) clamp(0.15, (0.5 - l) * 10000, 0.95) c h);
    animation: pulse 1.2s ease-in-out infinite;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.row-label {
  display: grid;
  place-items: center;
  block-size: var(--cell-size);
  color: var(--color-text-dim);
  font-weight: 600;
  font-size: 0.8rem;
  user-select: none;
}

.cell {
  inline-size: var(--cell-size);
  block-size: var(--cell-size);
  flex-shrink: 0;
  border-radius: 50%;
  background-color: var(--color-empty);
  cursor: pointer;
  transition:
    background-color 0.2s,
    box-shadow 0.2s;

  &.winning {
    animation: win-glow 0.6s ease-in-out infinite alternate;
  }

  &.last-move {
    position: relative;

    &::after {
      position: absolute;
      inline-size: 15%;
      block-size: 15%;
      inset: 50%;
      translate: -50% -50%;
      border-radius: 50%;
      /* Flips by 0.5 depending on lightness, but clamped to avoid pure black or pure white */
      background-color: oklch(
        from var(--glow) max(0.2, min(0.9, l + clamp(-0.5, (0.5 - l) * 10000, 0.5))) c h
      );
      content: '';
    }
  }

  &.ghost {
    position: relative;
    border: 2px dashed oklch(from var(--ghost-color) l c h / 0.4);
    background-color: oklch(from var(--ghost-color) l c h / 0.15);
    box-shadow: inset 0 0 8px oklch(from var(--ghost-color) l c h / 0.1);
    transition:
      background-color 0.2s,
      border-color 0.2s,
      box-shadow 0.2s;

    &:hover {
      border-color: oklch(from var(--ghost-color) l c h / 0.65);
      background-color: oklch(from var(--ghost-color) l c h / 0.35);
    }

    &.next-ghost {
      border-style: solid;
      border-color: oklch(from var(--ghost-color) max(0.6, l) c h / 0.7);
      background-color: oklch(from var(--ghost-color) l c h / 0.25);
      box-shadow:
        inset 0 0 8px oklch(from var(--ghost-color) l c h / 0.2),
        0 0 12px oklch(from var(--ghost-color) l c h / 0.4);
      animation: ghost-pulse 2s ease-in-out infinite alternate;

      &:hover {
        border-color: oklch(from var(--ghost-color) max(0.65, l) c h / 0.95);
        background-color: oklch(from var(--ghost-color) l c h / 0.4);
        box-shadow:
          inset 0 0 12px oklch(from var(--ghost-color) l c h / 0.3),
          0 0 16px oklch(from var(--ghost-color) l c h / 0.6);
      }
    }
  }
}

.ghost-step {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  translate: -50% -50%;
  color: oklch(from var(--ghost-color) max(0.65, l) c h / 0.85);
  font-weight: 700;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  user-select: none;
  pointer-events: none;

  .next-ghost & {
    color: oklch(from var(--ghost-color) max(0.75, l) c h);
    font-size: 0.8rem;
  }
}

@keyframes ghost-pulse {
  from {
    box-shadow:
      inset 0 0 8px oklch(from var(--ghost-color) l c h / 0.2),
      0 0 6px oklch(from var(--ghost-color) l c h / 0.25);
  }
  to {
    box-shadow:
      inset 0 0 8px oklch(from var(--ghost-color) l c h / 0.2),
      0 0 14px oklch(from var(--ghost-color) l c h / 0.5);
  }
}

@keyframes win-glow {
  from {
    box-shadow: 0 0 8px var(--glow);
  }
  to {
    box-shadow:
      0 0 24px var(--glow),
      0 0 40px var(--glow);
  }
}

@media (max-width: 720px) {
  .board-area {
    align-items: stretch;
    max-inline-size: 100%;
  }
}

.score-cell {
  padding: 4px 2px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  text-align: center;

  &.score-win {
    background-color: oklch(0.35 0.12 145);
    color: oklch(0.8 0.15 145);
  }

  &.score-draw {
    background-color: var(--color-surface-alt);
    color: var(--color-text-dim);
  }

  &.score-loss {
    background-color: oklch(0.3 0.1 25);
    color: oklch(0.75 0.15 25);
  }

  &.disabled {
    background-color: var(--color-surface-alt);
    color: var(--color-text-dim);
    opacity: 0.3;
  }
}

.eval-score {
  font-weight: 600;
  font-size: 0.85rem;
  font-family: var(--font-mono);

  &.eval-win {
    color: oklch(0.75 0.15 145);
  }

  &.eval-draw {
    color: var(--color-text-dim);
  }

  &.eval-loss {
    color: oklch(0.75 0.15 25);
  }
}

.eval-meter {
  inline-size: 100%;

  &::-webkit-meter-optimum-value,
  &::-webkit-meter-suboptimum-value,
  &::-webkit-meter-even-less-good-value {
    background-color: var(--winning-color, var(--color-win));
    transition: background-color 0.2s;
  }
  &::-moz-meter-bar {
    background-color: var(--winning-color, var(--color-win));
    transition: background-color 0.2s;
  }
}
</style>
