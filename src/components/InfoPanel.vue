<template>
  <aside class="info-panel">
    <div class="info-card">
      <h3>I play as</h3>
      <div class="role-picker">
        <button
          class="order-btn"
          :class="{active: game.userIsFirst}"
          @click="game.setUserIsFirst(true)"
        >
          1st player
        </button>
        <button
          class="order-btn"
          :class="{active: !game.userIsFirst}"
          @click="game.setUserIsFirst(false)"
        >
          2nd player
        </button>
      </div>
      <h3 style="margin-block-start: 0.6rem">Colors</h3>
      <div class="color-inputs">
        <label class="color-label">
          <input type="color" :value="game.color1" @input="game.setColor1($event.target.value)" />
          1st player
        </label>
        <label class="color-label">
          <input type="color" :value="game.color2" @input="game.setColor2($event.target.value)" />
          2nd player
        </label>
      </div>
    </div>

    <div class="info-card">
      <h2
        :style="{
          color: game.winLine ? undefined : game.displayColorOf(game.internalCurrentPlayer),
        }"
      >
        {{ game.statusTitle }}
      </h2>
      <p>{{ game.statusText }}</p>
    </div>

    <div v-if="game.positionEval" class="info-card eval-card">
      <h3>Position evaluation</h3>
      <div class="eval-row">
        <span class="eval-label" :style="{color: game.color1}">1st player</span>
        <span class="eval-score" :class="evalClass(game.positionEval.first)">
          {{ formatEval(game.positionEval.first) }}
        </span>
      </div>
      <div class="eval-row">
        <span class="eval-label" :style="{color: game.color2}">2nd player</span>
        <span class="eval-score" :class="evalClass(game.positionEval.second)">
          {{ formatEval(game.positionEval.second) }}
        </span>
      </div>
    </div>

    <div class="info-card">
      <h3>Move sequence</h3>
      <p class="mono">{{ game.repstr || '(start)' }}</p>
    </div>

    <div class="info-card">
      <h3>Suggested move</h3>
      <p v-if="game.solverLoading">Querying solver…</p>
      <p v-else-if="game.suggestion && game.suggestion.col > 0">Column {{ game.suggestion.col }}</p>
      <p v-else-if="game.winLine">Game over</p>
      <p v-else>—</p>
      <p v-if="game.suggestionLabel" class="dim">{{ game.suggestionLabel }}</p>
      <p v-if="game.solverError" class="dim" style="color: oklch(0.7 0.18 25)">
        Solver error: {{ game.solverError }}
      </p>
    </div>

    <div v-if="game.solverScores" class="info-card">
      <h3>Column scores</h3>
      <div class="score-row">
        <div v-for="(s, i) in game.solverScores" :key="i" class="score-cell" :class="scoreClass(s)">
          {{ s === -1000 ? '—' : s > 0 ? `+${s}` : s }}
        </div>
      </div>
      <p class="dim">+ = win, 0 = draw, − = loss (higher is better)</p>
    </div>

    <div class="controls">
      <button title="Step back" :disabled="!game.canStepBack" @click="game.stepBack()">
        ◀ Back
      </button>
      <button title="Step forward" :disabled="!game.canStepForward" @click="game.stepForward()">
        ▶ Fwd
      </button>
      <button v-if="game.isReviewingHistory" title="Jump to latest move" @click="game.goToLatest()">
        ⏭ Latest
      </button>
    </div>
    <div class="controls">
      <button
        v-if="!game.resetPending"
        title="Reset board (R)"
        :disabled="game.totalMoves === 0"
        @click="game.resetBoard()"
      >
        ⟳ Reset
      </button>
      <template v-else>
        <button class="confirm-btn" @click="game.resetBoard()">Confirm reset</button>
        <button @click="game.cancelReset()">Cancel</button>
      </template>
      <button
        title="Auto-play opponent's moves"
        :class="{active: game.autoEnabled}"
        @click="game.toggleAuto()"
      >
        {{ game.autoEnabled ? '⏸ Auto Opp' : '▶ Auto Opp' }}
      </button>
    </div>

    <p class="move-counter dim">Move {{ game.viewCursor }} / {{ game.totalMoves }}</p>

    <div class="info-card">
      <h3>Solver</h3>
      <p class="dim">
        <template v-if="!game.solverStatus.moduleReady">Loading WASM module…</template>
        <template v-else-if="game.solverStatus.bookLoading">Loading opening book…</template>
        <template v-else-if="game.solverStatus.bookError">
          Book error: {{ game.solverStatus.bookError }}
        </template>
        <template v-else-if="game.solverStatus.bookLoaded">Ready (with opening book)</template>
        <template v-else>Ready (no opening book)</template>
      </p>
    </div>

    <p class="credit">
      Solver by
      <a href="http://connect4.gamesolver.org" target="_blank" rel="noopener">Pascal Pons</a>.
      Inspired by
      <a href="https://2swap.github.io/WeakC4/" target="_blank" rel="noopener">2swap's WeakC4</a>.
      Made for personal use.
    </p>
  </aside>
</template>

<script setup>
import {useGameStore} from '@/stores/game';

const game = useGameStore();

function scoreClass(score) {
  if (score === -1000) return 'score-full';
  if (score > 0) return 'score-win';
  if (score === 0) return 'score-draw';
  return 'score-loss';
}

function evalClass(score) {
  if (score > 0) return 'eval-win';
  if (score === 0) return 'eval-draw';
  return 'eval-loss';
}

function formatEval(score) {
  if (score > 0) return `+${score} (wins)`;
  if (score === 0) return '0 (draw)';
  return `${score} (loses)`;
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

.role-picker {
  display: flex;
  gap: 0.5rem;

  @container info-panel (max-width: 300px) {
    flex-direction: column;
  }
}

.color-inputs {
  display: flex;
  gap: 1rem;
}

.color-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--color-text-dim);
  font-size: 0.85rem;
  cursor: pointer;

  & input[type='color'] {
    inline-size: 28px;
    block-size: 28px;
    padding: 0;
    border: 2px solid var(--color-border);
    border-radius: var(--radius-sm);
    background-color: transparent;
    cursor: pointer;
  }
}

.score-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3px;
  font-size: 0.8rem;
  font-family: var(--font-mono);
  text-align: center;
}

.score-cell {
  padding: 4px 2px;
  border-radius: 3px;
  font-weight: 600;

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

  &.score-full {
    background-color: var(--color-surface-alt);
    color: var(--color-text-dim);
    opacity: 0.4;
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

    &:hover:not(:disabled) {
      background-color: var(--color-surface-alt);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.3;
    }

    &.active {
      border-color: var(--color-accent);
      background-color: var(--color-accent);
      color: var(--color-bg);
    }

    &.confirm-btn {
      border-color: oklch(0.6 0.22 25);
      background-color: oklch(0.45 0.2 25);
      color: white;

      &:hover {
        background-color: oklch(0.5 0.22 25);
      }
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

.eval-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
}

.eval-label {
  font-weight: 600;
  font-size: 0.9rem;
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

.move-counter {
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
