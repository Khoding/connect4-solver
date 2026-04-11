<template>
  <div class="board-area">
    <div class="board-grid">
      <div class="column-buttons">
        <button
          v-for="c in game.COLS"
          :key="c"
          class="col-btn"
          :class="{
            suggested:
              game.suggestion?.bestCols?.includes(c) &&
              game.boardArr[game.ROWS - 1][c - 1] === 0 &&
              !game.winLine,
          }"
          :style="
            game.suggestion?.bestCols?.includes(c) &&
            game.boardArr[game.ROWS - 1][c - 1] === 0 &&
            !game.winLine
              ? {
                  backgroundColor: game.displayColorOf(game.internalCurrentPlayer),
                  color: 'var(--color-bg)',
                }
              : {}
          "
          :disabled="game.boardArr[game.ROWS - 1][c - 1] !== 0 || !!game.winLine"
          @click="game.makeMove(c)"
        >
          {{ c }}
        </button>
      </div>

      <div class="row-labels">
        <div v-for="vr in game.ROWS" :key="vr" class="row-label">{{ game.ROWS - vr + 1 }}</div>
      </div>

      <div class="board">
        <template v-for="vr in game.ROWS" :key="vr">
          <div
            v-for="c in game.COLS"
            :key="`${vr}-${c}`"
            class="cell"
            :style="cellStyle(game.ROWS - vr, c - 1)"
            :class="{winning: isWinningCell(game.ROWS - vr, c - 1)}"
            @click="game.makeMove(c)"
          ></div>
        </template>
      </div>
    </div>
    <div class="player-indicators">
      <span :style="{color: game.color1}">P1</span>
      <span :style="{color: game.color2}">P2</span>
    </div>
  </div>
</template>

<script setup>
import {useGameStore} from '@/stores/game';

const game = useGameStore();

function cellStyle(row, col) {
  const p = game.boardArr[row][col];
  if (p === 0) return {};
  const color = game.displayColorOf(p);
  return {
    backgroundColor: color,
    boxShadow: `0 0 12px ${color}40`,
    '--glow': color,
  };
}

function isWinningCell(row, col) {
  return game.winLine?.some(([wy, wx]) => wy === row && wx === col) ?? false;
}
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
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 0.5rem;
}

.column-buttons {
  display: grid;
  grid-template-columns: repeat(7, var(--cell-size));
  grid-row: 1;
  grid-column: 2;
  margin-block-end: 4px;
  padding-inline: var(--board-gap);
  gap: var(--board-gap);
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
  display: grid;
  grid-template-rows: repeat(6, var(--cell-size));
  grid-template-columns: repeat(7, var(--cell-size));
  grid-row: 2;
  grid-column: 2;
  padding: var(--board-gap);
  gap: var(--board-gap);
  border-radius: calc(var(--board-gap) + var(--cell-size) / 2);
  background-color: oklch(0.3 0.1 250);
}

.player-indicators {
  display: flex;
  justify-content: center;
  margin-block-start: 0.5rem;
  gap: 1rem;
  font-size: small;
}

.col-btn {
  block-size: 28px;
  border: none;
  border-radius: var(--radius-sm);
  background-color: var(--color-surface-alt);
  color: var(--color-text-dim);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition:
    background-color 0.15s,
    color 0.15s;

  &:hover:not(:disabled) {
    background-color: var(--color-accent);
    color: var(--color-bg);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.3;
  }

  &.suggested {
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
  border-radius: 50%;
  background-color: var(--color-empty);
  cursor: pointer;
  transition:
    background-color 0.2s,
    box-shadow 0.2s;

  &.winning {
    animation: win-glow 0.6s ease-in-out infinite alternate;
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
</style>
