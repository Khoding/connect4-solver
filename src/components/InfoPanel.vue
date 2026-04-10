<template>
  <aside class="info-panel">
    <div class="controls">
      <button title="Step back" :disabled="!game.canStepBack" @click="game.stepBack()">
        ◀ Back
      </button>
      <button title="Step forward" :disabled="!game.canStepForward" @click="game.stepForward()">
        ▶ Forward
      </button>
      <button
        title="Jump to latest move"
        :disabled="!game.isReviewingHistory"
        @click="game.goToLatest()"
      >
        ⏭ Latest
      </button>
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

    <div class="info-card">
      <h3>Move sequence</h3>
      <p class="mono">{{ game.repstr || '(start)' }}</p>
      <p class="dim">Move {{ game.viewCursor }} / {{ game.totalMoves }}</p>
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
        <span class="eval-score" :class="evalClass(game.runningTotals.first)">
          {{ formatTotal(game.runningTotals.first) }}
        </span>
      </div>
      <div class="eval-row">
        <span class="eval-label" :style="{color: game.color2}">2nd player</span>
        <span class="eval-score" :class="evalClass(game.positionEval.second)">
          {{ formatEval(game.positionEval.second) }}
        </span>
        <span class="eval-score" :class="evalClass(game.runningTotals.second)">
          {{ formatTotal(game.runningTotals.second) }}
        </span>
      </div>
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

    <div class="controls">
      <button
        v-if="!game.resetPending"
        title="Reset board (R)"
        :disabled="game.totalMoves === 0"
        @click="game.resetBoard()"
      >
        ⟳ Reset (R)
      </button>
      <template v-else>
        <button class="confirm-btn" @click="game.resetBoard()">Confirm reset</button>
        <button @click="game.cancelReset()">Cancel</button>
      </template>
      <button
        title="Auto-play player 2's moves"
        :class="{active: game.autoEnabled}"
        @click="game.toggleAuto()"
      >
        {{ game.autoEnabled ? '⏸ Auto P2' : '▶ Auto P2' }}
      </button>
    </div>

    <div class="info-card">
      <h3>Colors</h3>
      <div class="color-inputs">
        <label class="color-label">
          <input type="color" :value="game.color1" @input="game.setColor1($event.target.value)" />
          1st player
        </label>
        <button class="swap-btn" title="Swap colors" @click="game.swapColors()">⇄</button>
        <label class="color-label">
          <input type="color" :value="game.color2" @input="game.setColor2($event.target.value)" />
          2nd player
        </label>
      </div>
      <div v-if="presets.length" class="presets">
        <div v-for="(preset, i) in presets" :key="i" class="preset-item">
          <button class="preset-swatch" :title="preset.name" @click="applyPreset(preset)">
            <span class="swatch-dot" :style="{backgroundColor: preset.color1}" />
            <span class="swatch-dot" :style="{backgroundColor: preset.color2}" />
          </button>
          <button class="preset-remove" title="Remove preset" @click="removePreset(i)">×</button>
        </div>
      </div>
      <button class="save-preset-btn" @click="savePreset">+ Save preset</button>
    </div>

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
import {ref} from 'vue';
import {useGameStore} from '@/stores/game';

const game = useGameStore();

/* ── Color presets ─────────────────────────────────────── */

const PRESETS_KEY = 'c4_color_presets';

function loadPresets() {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistPresets() {
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets.value));
  } catch {
    /* storage full or unavailable */
  }
}

const presets = ref(loadPresets());

function savePreset() {
  const name = `Preset ${presets.value.length + 1}`;
  presets.value.push({name, color1: game.color1, color2: game.color2});
  persistPresets();
}

function applyPreset(preset) {
  game.setColor1(preset.color1);
  game.setColor2(preset.color2);
}

function removePreset(index) {
  presets.value.splice(index, 1);
  persistPresets();
}

/* ── Score helpers ─────────────────────────────────────── */

function scoreClass(score) {
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

function formatTotal(score) {
  if (score > 0) return `+${score}`;
  return `${score}`;
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

.color-inputs {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.swap-btn {
  padding: 4px 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
  color: var(--color-text-dim);
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
  transition:
    color 0.15s,
    border-color 0.15s;

  &:hover {
    border-color: var(--color-accent);
    color: var(--color-text);
  }
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

.presets {
  display: flex;
  flex-wrap: wrap;
  margin-block-start: 0.5rem;
  gap: 0.4rem;
}

.preset-item {
  display: flex;
  align-items: center;
  gap: 2px;
}

.preset-swatch {
  display: flex;
  padding: 4px 6px;
  gap: 3px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm) 0 0 var(--radius-sm);
  background-color: var(--color-surface);
  cursor: pointer;
  transition: border-color 0.15s;

  &:hover {
    border-color: var(--color-accent);
  }
}

.preset-remove {
  padding: 4px 5px;
  border: 2px solid var(--color-border);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  border-inline-start: none;
  background-color: var(--color-surface);
  color: var(--color-text-dim);
  font-size: 0.85rem;
  line-height: 1;
  cursor: pointer;
  transition:
    color 0.15s,
    border-color 0.15s;

  &:hover {
    border-color: oklch(0.6 0.22 25);
    color: oklch(0.75 0.15 25);
  }
}

.swatch-dot {
  display: block;
  inline-size: 16px;
  block-size: 16px;
  border-radius: 50%;
}

.save-preset-btn {
  margin-block-start: 0.5rem;
  padding: 6px 12px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-sm);
  background-color: transparent;
  color: var(--color-text-dim);
  font-size: 0.8rem;
  cursor: pointer;
  transition:
    color 0.15s,
    border-color 0.15s;

  &:hover {
    border-color: var(--color-accent);
    color: var(--color-text);
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
