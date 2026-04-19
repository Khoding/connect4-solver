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
  <aside class="info-panel">
    <div class="controls">
      <button title="Step back" :disabled="!game.canStepBack" @click="game.stepBack()">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="1.2em"
          viewBox="0 -960 960 960"
          width="1.2em"
          fill="currentColor"
        >
          <path d="M640-200 200-480l440-280v560Zm-80-280Zm0 134v-268L350-480l210 134Z" />
        </svg>
        Back
      </button>
      <button title="Step forward" :disabled="!game.canStepForward" @click="game.stepForward()">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="1.2em"
          viewBox="0 -960 960 960"
          width="1.2em"
          fill="currentColor"
        >
          <path d="M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z" />
        </svg>
        Forward
      </button>
      <button
        title="Jump to latest move"
        :disabled="!game.isReviewingHistory"
        @click="game.goToLatest()"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="1.2em"
          viewBox="0 -960 960 960"
          width="1.2em"
          fill="currentColor"
        >
          <path
            d="M660-240v-480h80v480h-80Zm-440 0v-480l320 240-320 240Zm80-240Zm0 114 152-114-152-114v228Z"
          />
        </svg>
        Latest
      </button>
    </div>

    <div class="info-card">
      <h3>Move sequence</h3>
      <p class="mono">
        <template v-if="!game.repstr"> (start) </template>
        <template v-else>
          <span
            v-for="(move, i) in game.repstr"
            :key="i"
            class="move-char"
            :class="{
              'is-optimal': game.moveOptimality[i] === true,
              'is-suboptimal': game.moveOptimality[i] === false,
            }"
            :title="
              game.moveOptimality[i] === true
                ? 'Optimal move'
                : game.moveOptimality[i] === false
                  ? 'Suboptimal move'
                  : 'Unknown'
            "
            >{{ move }}</span
          >
        </template>
      </p>
      <p class="dim">
        Move {{ game.viewCursor }} / {{ game.totalMoves }} &bull;
        <RouterLink to="/rules">{{ game.currentOpening }}</RouterLink>
      </p>
    </div>

    <div
      class="info-card eval-card"
      :style="!game.positionEval && {opacity: 0.35, pointerEvents: 'none'}"
    >
      <h3>Position evaluation</h3>
      <div class="eval-row">
        <span class="eval-label" :style="{color: `oklch(from ${game.color1} max(0.65, l) c h)`}">
          1st player
        </span>
        <span class="eval-score" :class="evalClass(game.positionEval?.first)">
          {{ formatEval(game.positionEval?.first) }}
        </span>
      </div>
      <div class="eval-row">
        <span class="eval-label" :style="{color: `oklch(from ${game.color2} max(0.65, l) c h)`}">
          2nd player
        </span>
        <span class="eval-score" :class="evalClass(game.positionEval?.second)">
          {{ formatEval(game.positionEval?.second) }}
        </span>
      </div>
    </div>

    <div class="controls">
      <button
        v-if="!game.resetPending"
        title="Reset board (R)"
        :disabled="game.totalMoves === 0"
        @click="game.resetBoard()"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="1.2em"
          viewBox="0 -960 960 960"
          width="1.2em"
          fill="currentColor"
        >
          <path
            d="M339.5-108.5q-65.5-28.5-114-77t-77-114Q120-365 120-440h80q0 117 81.5 198.5T480-160q117 0 198.5-81.5T760-440q0-117-81.5-198.5T480-720h-6l62 62-56 58-160-160 160-160 56 58-62 62h6q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-440q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-80q-75 0-140.5-28.5Z"
          />
        </svg>
        Reset (R)
      </button>
      <template v-else>
        <button class="confirm-btn" @click="game.resetBoard()">Confirm reset</button>
        <button @click="game.cancelReset()">Cancel</button>
      </template>
    </div>

    <div class="controls">
      <button
        title="Auto-play player 1's moves"
        :class="{active: game.autoP1}"
        @click="game.toggleAutoP1()"
      >
        <svg
          v-if="game.autoP1"
          xmlns="http://www.w3.org/2000/svg"
          height="1.2em"
          viewBox="0 -960 960 960"
          width="1.2em"
          fill="currentColor"
        >
          <path
            d="M520-200v-560h240v560H520Zm-320 0v-560h240v560H200Zm400-80h80v-400h-80v400Zm-320 0h80v-400h-80v400Zm0-400v400-400Zm320 0v400-400Z"
          />
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          height="1.2em"
          viewBox="0 -960 960 960"
          width="1.2em"
          fill="currentColor"
        >
          <path d="M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z" />
        </svg>
        Auto P1
      </button>
      <button
        title="Auto-play player 2's moves"
        :class="{active: game.autoP2}"
        @click="game.toggleAutoP2()"
      >
        <svg
          v-if="game.autoP2"
          xmlns="http://www.w3.org/2000/svg"
          height="1.2em"
          viewBox="0 -960 960 960"
          width="1.2em"
          fill="currentColor"
        >
          <path
            d="M520-200v-560h240v560H520Zm-320 0v-560h240v560H200Zm400-80h80v-400h-80v400Zm-320 0h80v-400h-80v400Zm0-400v400-400Zm320 0v400-400Z"
          />
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          height="1.2em"
          viewBox="0 -960 960 960"
          width="1.2em"
          fill="currentColor"
        >
          <path d="M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z" />
        </svg>
        Auto P2
      </button>
    </div>

    <div class="controls">
      <button
        title="Replay the game from the start"
        :disabled="!game.gameHasWin && !game.replayActive"
        :class="{active: game.replayActive}"
        @click="game.replayActive ? game.stopReplay() : game.startReplay()"
      >
        <svg
          v-if="game.replayActive"
          xmlns="http://www.w3.org/2000/svg"
          height="1.2em"
          viewBox="0 -960 960 960"
          width="1.2em"
          fill="currentColor"
        >
          <path d="M320-320v-320h320v320H320Z" />
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          height="1.2em"
          viewBox="0 -960 960 960"
          width="1.2em"
          fill="currentColor"
        >
          <path
            d="M339.5-108.5q-65.5-28.5-114-77t-77-114Q120-365 120-440h80q0 117 81.5 198.5T480-160q117 0 198.5-81.5T760-440q0-117-81.5-198.5T480-720h-6l62 62-56 58-160-160 160-160 56 58-62 62h6q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-440q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-80q-75 0-140.5-28.5Z"
          />
        </svg>
        {{ game.replayActive ? 'Stop' : 'Replay' }}
      </button>
      <button
        v-if="!game.replayActive"
        title="Continue replay from current position"
        :disabled="!game.isReviewingHistory || !game.gameHasWin"
        @click="game.continueReplay()"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="1.2em"
          viewBox="0 -960 960 960"
          width="1.2em"
          fill="currentColor"
        >
          <path d="M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z" />
        </svg>
        Continue
      </button>
    </div>

    <div class="info-card">
      <h3>Colors</h3>
      <div class="color-inputs">
        <label class="color-label">
          <input type="color" :value="game.color1" @input="game.setColor1($event.target.value)" />
          <input
            type="text"
            class="color-hex"
            :value="game.color1"
            maxlength="7"
            @change="updateColor1($event.target.value)"
          />
        </label>
        <button class="swap-btn" title="Swap colors" @click="game.swapColors()">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="1.2em"
            viewBox="0 -960 960 960"
            width="1.2em"
            fill="currentColor"
          >
            <path
              d="M280-120 80-320l200-200 57 56-104 104h607v80H233l104 104-57 56Zm400-320-57-56 104-104H120v-80h607L623-784l57-56 200 200-200 200Z"
            />
          </svg>
        </button>
        <label class="color-label">
          <input type="color" :value="game.color2" @input="game.setColor2($event.target.value)" />
          <input
            type="text"
            class="color-hex"
            :value="game.color2"
            maxlength="7"
            @change="updateColor2($event.target.value)"
          />
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
      <p class="dim">{{ game.solverStatusText }}</p>
      <p v-if="game.solverError" class="dim" style="color: oklch(0.7 0.18 25)">
        Solver error: {{ game.solverError }}
      </p>
    </div>

    <p class="credit">
      Solver by
      <a href="http://connect4.gamesolver.org" target="_blank" rel="noopener">Pascal Pons</a>.
      Inspired by
      <a href="https://2swap.github.io/WeakC4/" target="_blank" rel="noopener">2swap's WeakC4</a>.
      <br />
      <a href="https://github.com/Khoding/connect4-solver" target="_blank" rel="noopener"
        >GitHub Repository</a
      >
      <br />
      Licensed under
      <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener"
        >AGPL-3.0</a
      >
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

/* ── Color hex input helpers ───────────────────────────── */

const HEX_RE = /^#?([0-9a-f]{6})$/i;

function normalizeHex(value) {
  const match = value.trim().match(HEX_RE);
  return match ? `#${match[1]}` : null;
}

function updateColor1(value) {
  const hex = normalizeHex(value);
  if (hex) game.setColor1(hex);
}

function updateColor2(value) {
  const hex = normalizeHex(value);
  if (hex) game.setColor2(hex);
}

/* ── Score helpers ─────────────────────────────────────── */

function evalClass(score) {
  score = score ?? 0;
  if (score > 0) return 'eval-win';
  if (score === 0) return 'eval-draw';
  return 'eval-loss';
}

function formatEval(score) {
  score = score ?? 0;
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

.move-char {
  &.is-optimal {
    color: oklch(0.75 0.15 150);
  }

  &.is-suboptimal {
    color: oklch(0.65 0.2 25);
  }
}

.color-inputs {
  display: flex;
  align-items: center;
  gap: clamp(0.5rem, 1.5vw, 1rem);

  @container info-panel (max-width: 350px) {
    & {
      flex-direction: column;
      align-items: stretch;
    }
  }
}

.swap-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-inline-size: fit-content;
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

.color-hex {
  inline-size: 5.5em;
  padding: 4px 6px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
  color: var(--color-text);
  font-size: 0.8rem;
  font-family: var(--font-mono);
  text-transform: uppercase;
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
    display: inline-flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    padding: 8px 12px;
    gap: 0.3rem;
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

      &:hover {
        background-color: color-mix(in oklch, var(--color-accent), black 15%);
      }
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
