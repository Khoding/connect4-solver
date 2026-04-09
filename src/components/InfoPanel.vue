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
      <p v-if="!game.userIsFirst" class="dim" style="margin-block-start: 0.4rem">
        Opening book helps 1st player only. Solver API provides suggestions for all positions.
      </p>
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
      <p
        v-if="game.ssBroken && game.inSteadyState && !game.apiSuggestion"
        class="deviation-warning"
      >
        ⚠ First player deviated — querying solver for fallback.
      </p>
    </div>

    <div class="info-card">
      <h3>Opening</h3>
      <p>{{ game.openingName }}</p>
      <RouterLink to="/rules#openings">Openings</RouterLink>
    </div>

    <div class="info-card">
      <h3>Move sequence</h3>
      <p class="mono">{{ game.repstr || '(start)' }}</p>
    </div>

    <div class="info-card">
      <h3>Suggested move</h3>
      <p v-if="game.apiLoading">Querying solver…</p>
      <p v-else-if="game.bestSuggestion && game.bestSuggestion.col > 0">
        Column {{ game.bestSuggestion.col }}
        <span v-if="game.bestSuggestion.source === 'solver'" class="source-badge">solver</span>
      </p>
      <p v-else-if="game.winLine">Game over</p>
      <p v-else>—</p>
      <p v-if="game.suggestionLabel" class="dim">{{ game.suggestionLabel }}</p>
      <p v-if="game.apiError" class="dim" style="color: oklch(0.7 0.18 25)">
        Solver error: {{ game.apiError }}
      </p>
    </div>

    <div v-if="game.apiScores" class="info-card">
      <h3>Column scores</h3>
      <div class="score-row">
        <div v-for="(s, i) in game.apiScores" :key="i" class="score-cell" :class="scoreClass(s)">
          {{ s === 100 ? '—' : s > 0 ? `+${s}` : s }}
        </div>
      </div>
      <p class="dim">+ = win, 0 = draw, − = loss (higher is better)</p>
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
    return game.boardArr[ir][c] === 1 ? 'P1' : 'P2';
  }
  return ch === ' ' ? '·' : ch;
}

function ssCellOccupied(vr, c) {
  const ir = 5 - vr;
  return game.boardArr[ir]?.[c] !== 0;
}

function scoreClass(score) {
  if (score === 100) return 'score-full';
  if (score > 0) return 'score-win';
  if (score === 0) return 'score-draw';
  return 'score-loss';
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

.deviation-warning {
  margin-block-start: 0.35rem;
  color: oklch(0.75 0.18 60);
  font-size: 0.85rem;
}

.source-badge {
  display: inline-block;
  margin-inline-start: 0.4rem;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  background-color: oklch(0.35 0.12 260);
  color: oklch(0.85 0.08 260);
  font-weight: 600;
  font-size: 0.7rem;
  text-transform: uppercase;
  vertical-align: middle;
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
