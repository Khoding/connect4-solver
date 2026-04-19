<template>
  <div class="board-area">
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

        <div
          v-for="c in game.COLS"
          :key="c"
          class="col-header"
          :class="{
            suggested:
              game.suggestion?.bestCols?.includes(c) &&
              game.boardArr[game.ROWS - 1][c - 1] === 0 &&
              !game.winLine,
            disabled: game.boardArr[game.ROWS - 1][c - 1] !== 0 || !!game.winLine,
          }"
          :style="
            game.suggestion?.bestCols?.includes(c) &&
            game.boardArr[game.ROWS - 1][c - 1] === 0 &&
            !game.winLine
              ? {
                  '--player-color': game.displayColorOf(game.internalCurrentPlayer),
                }
              : {}
          "
        >
          {{ c }}
        </div>
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
            :class="{
              winning: isWinningCell(game.ROWS - vr, c - 1),
              'last-move': isLastMove(game.ROWS - vr, c - 1),
            }"
            @click="game.makeMove(c)"
          ></div>
        </template>
      </div>
    </div>
    <div class="player-indicators">
      <span :style="{color: `oklch(from ${game.color1} max(0.65, l) c h)`}">
        P1
        <span v-if="game.winLine && game.internalCurrentPlayer === 2" class="winner-label"
          >(Winner)</span
        >
      </span>
      <span :style="{color: `oklch(from ${game.color2} max(0.65, l) c h)`}">
        P2
        <span v-if="game.winLine && game.internalCurrentPlayer === 1" class="winner-label"
          >(Winner)</span
        >
      </span>
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
}

.column-buttons {
  display: grid;
  grid-template-columns: repeat(7, var(--cell-size));
  grid-column: 2;
  margin-block-end: 4px;
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
  gap: 1rem;
  font-size: small;
}

.player-indicators > span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.winner-label {
  font-weight: 700;
  text-transform: uppercase;
}

.col-header {
  padding: 4px 2px;
  border-radius: var(--radius-sm);
  background-color: var(--color-surface-alt);
  color: var(--color-text-dim);
  font-weight: 600;
  text-align: center;

  &.disabled {
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
</style>
