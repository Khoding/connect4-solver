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
              game.bestSuggestion?.col === c &&
              game.boardArr[game.ROWS - 1][c - 1] === 0 &&
              !game.winLine,
          }"
          :style="
            game.bestSuggestion?.col === c &&
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
          >
            <span
              v-if="showSsMarker(game.ROWS - vr, c - 1)"
              class="ss-marker"
              :class="ssMarkerClass(game.ROWS - vr, c - 1)"
            >
              {{ ssMarkerText(getSsCode(game.ROWS - vr, c - 1)) }}
            </span>
          </div>
        </template>
      </div>
    </div>

    <div class="board-footer">
      {{
        game.inSteadyState && !game.winLine
          ? 'Steady-state active — markers on the board show priorities.'
          : ''
      }}
    </div>

    <button class="mobile-only rules-btn-mobile" title="Show Rules" @click="$emit('open-rules')">
      📜 How to read the steady-state
    </button>

    <details class="info-card rules desktop-only" open>
      <summary>
        <h3>How to read the steady-state</h3>
      </summary>
      <SteadyStateRules />
    </details>
  </div>
</template>

<script setup>
import {useGameStore} from '@/stores/game';
import SteadyStateRules from '@/components/SteadyStateRules.vue';

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

function ssMarkerText(code) {
  const ch = String.fromCharCode(code);
  return ch === ' ' ? '·' : ch;
}

function ssMarkerClass(row, col) {
  const isPlayable = row === 0 || game.boardArr[row - 1][col] !== 0;
  return isPlayable ? 'active-marker' : 'floating';
}

function showSsMarker(row, col) {
  if (!game.inSteadyState || !game.ssData) return false;
  if (game.boardArr[row][col] !== 0) return false;
  const ssRow = 5 - row;
  const code = game.ssData[ssRow][col];
  const ch = String.fromCharCode(code);
  return ch !== '1' && ch !== '2';
}

function getSsCode(row, col) {
  return game.ssData[5 - row][col];
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
  border-radius: var(--radius-lg);
  background-color: oklch(0.3 0.1 250);
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
  display: grid;
  position: relative;
  place-items: center;
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

.ss-marker {
  position: absolute;
  color: var(--color-text);
  font-weight: 700;
  font-size: clamp(0.7rem, 1.5vw, 1rem);
  font-family: var(--font-mono);
  text-shadow: 0 1px 3px oklch(0 0 0 / 0.7);
  opacity: 0.85;
  pointer-events: none;

  &.floating {
    opacity: 0.35;
  }

  &.active-marker {
    color: var(--color-win);
    text-shadow: 0 0 6px var(--color-win);
    opacity: 1;
  }
}

.board-footer {
  min-block-size: 1.5em;
  margin-block-start: 0.5rem;
  color: var(--color-text-dim);
  font-size: 0.85rem;
  text-align: center;
}

.rules-btn-mobile {
  width: 100%;
  margin-block-start: 1rem;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
  color: var(--color-text);
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover {
    background-color: var(--color-surface-alt);
  }
}

.rules {
  width: 100%;
  max-inline-size: 500px;
  margin-block-start: 1.5rem;
  interpolate-size: allow-keywords;

  &::details-content {
    block-size: 0;
    overflow: hidden;
    transition:
      block-size 0.35s ease,
      content-visibility 0.35s ease;
    transition-behavior: allow-discrete;
  }

  &[open]::details-content {
    block-size: auto;
  }

  & summary {
    list-style: none;
    cursor: pointer;

    &::-webkit-details-marker {
      display: none;
    }

    & h3::before {
      content: '▸ ';
    }
  }

  &[open] summary h3::before {
    content: '▾ ';
  }
}

@media (max-width: 720px) {
  .board-area {
    align-items: stretch;
    max-inline-size: 100%;
  }
}
</style>
