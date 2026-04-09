<template>
  <aside class="info-panel">
    <div class="info-card">
      <h3>Play as</h3>
      <div class="color-picker">
        <button
          class="color-btn red"
          :class="{active: game.userColor === 1}"
          @click="game.setUserColor(1)"
        >
          Red
        </button>
        <button
          class="color-btn yellow"
          :class="{active: game.userColor === 2}"
          @click="game.setUserColor(2)"
        >
          Yellow
        </button>
      </div>
      <h3 style="margin-top: 0.6rem">Turn order</h3>
      <div class="color-picker">
        <button
          class="order-btn"
          :class="{active: game.firstPlayer === 1}"
          @click="game.setFirstPlayer(1)"
        >
          Red first
        </button>
        <button
          class="order-btn"
          :class="{active: game.firstPlayer === 2}"
          @click="game.setFirstPlayer(2)"
        >
          Yellow first
        </button>
      </div>
    </div>

    <div class="info-card">
      <h2
        :style="{
          color: game.winLine
            ? undefined
            : game.currentPlayer === 1
              ? 'var(--color-red)'
              : 'var(--color-yellow)',
        }"
      >
        {{ game.statusTitle }}
      </h2>
      <p>{{ game.statusText }}</p>
    </div>

    <div class="info-card">
      <h3>Opening</h3>
      <p>{{ game.openingName }}</p>
    </div>

    <div class="info-card">
      <h3>Move sequence</h3>
      <p class="mono">{{ game.repstr || '(start)' }}</p>
    </div>

    <div class="info-card">
      <h3>Suggested move</h3>
      <p v-if="game.suggestion && game.suggestion.col > 0">Column {{ game.suggestion.col }}</p>
      <p v-else-if="game.winLine">Game over</p>
      <p v-else>—</p>
      <p v-if="game.suggestionLabel" class="dim">{{ game.suggestionLabel }}</p>
    </div>

    <div class="info-card steady-state">
      <h3>Steady-state diagram</h3>
      <div v-if="game.ssData" class="ss-grid">
        <template v-for="vr in game.ROWS" :key="vr">
          <div
            v-for="c in game.COLS"
            :key="`${vr}-${c}`"
            class="ss-cell"
            :class="{occupied: ssCellOccupied(vr - 1, c - 1)}"
          >
            {{ ssCellContent(vr - 1, c - 1) }}
          </div>
        </template>
      </div>
      <p class="dim">
        {{
          game.inSteadyState
            ? 'Active: follow the priorities to pick your move.'
            : 'In the opening tree — no steady state yet.'
        }}
      </p>
    </div>

    <div class="controls">
      <button title="Undo last move (U)" @click="game.undo()">↩ Undo</button>
      <button title="Reset board (R)" @click="game.resetBoard()">⟳ Reset</button>
      <button
        title="Auto-play opponent's moves"
        :class="{active: game.autoEnabled}"
        @click="game.toggleAuto()"
      >
        {{ game.autoEnabled ? '⏸ Auto Opp' : '▶ Auto Opp' }}
      </button>
    </div>

    <p class="credit">
      Data &amp; research by
      <a href="https://2swap.github.io/WeakC4/" target="_blank" rel="noopener">2swap</a>.
      <a href="https://2swap.github.io/WeakC4/explanation/" target="_blank" rel="noopener"
        >Full explanation</a
      >.
      <a href="https://youtu.be/KaljD3Q3ct0" target="_blank" rel="noopener">Video explanation</a>.
    </p>
  </aside>
</template>

<script setup>
import {useGameStore} from '@/stores/game';

const game = useGameStore();

function ssCellContent(vr, c) {
  if (!game.ssData) return '';
  const code = game.ssData[vr][c];
  const ch = String.fromCharCode(code);
  const ir = 5 - vr;
  if (game.boardArr[ir]?.[c] !== 0) {
    return game.boardArr[ir][c] === 1 ? 'R' : 'Y';
  }
  return ch === ' ' ? '·' : ch;
}

function ssCellOccupied(vr, c) {
  const ir = 5 - vr;
  return game.boardArr[ir]?.[c] !== 0;
}
</script>

<style scoped>
.info-panel {
  container-name: info-panel;
  container-type: inline-size;

  display: flex;
  flex: 1;
  flex-direction: column;
  max-inline-size: 380px;
  gap: 1rem;
}

.ss-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  font-size: 0.8rem;
  font-family: var(--font-mono);
  text-align: center;
}

.ss-cell {
  min-inline-size: 30px;
  min-block-size: 1.6em;
  padding: 3px;
  border-radius: 3px;
  background-color: var(--color-surface-alt);
  line-height: 1.6em;

  &.occupied {
    color: var(--color-text-dim);
    opacity: 0.5;
  }

  &.active-priority {
    background-color: oklch(0.4 0.15 140);
    color: white;
    font-weight: 700;
  }
}

.color-picker {
  display: flex;
  gap: 0.5rem;

  @container info-panel (max-width: 300px) {
    flex-direction: column;
  }
}

.color-btn {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid transparent;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.15s;

  &.red {
    background-color: var(--color-red);
    color: white;
    opacity: 0.45;
  }

  &.yellow {
    background-color: var(--color-yellow);
    color: var(--color-bg);
    opacity: 0.45;
  }

  &.active {
    border-color: white;
    opacity: 1;
  }
}

.order-btn {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid transparent;
  border-radius: var(--radius-sm);
  background-color: var(--color-surface-alt);
  color: var(--color-text-dim);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  opacity: 0.6;
  transition: all 0.15s;

  &.active {
    border-color: var(--color-accent);
    background-color: var(--color-surface-alt);
    color: var(--color-text);
    opacity: 1;
  }
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;

  & button {
    flex: 1;
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

    &.active {
      border-color: var(--color-accent);
      background-color: var(--color-accent);
      color: var(--color-bg);
    }
  }

  @container info-panel (max-width: 350px) {
    & {
      flex-direction: column;
    }
  }
}

.credit {
  color: var(--color-text-dim);
  font-size: 0.8rem;
  text-align: center;
}

@media (max-width: 720px) {
  .info-panel {
    inline-size: 100%;
    max-inline-size: 100%;
  }
}

@media (min-width: 721px) and (max-width: 1100px) {
  .info-panel {
    min-inline-size: 260px;
  }
}
</style>
