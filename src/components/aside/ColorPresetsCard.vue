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
  <section v-if="!game.hideColors" class="info-card" aria-labelledby="colors-heading">
    <h2 id="colors-heading" class="card-heading">Colors</h2>
    <div class="color-inputs">
      <div class="color-control-group">
        <label :for="p1ColorId" class="sr-only">Player 1 color picker</label>
        <input
          :id="p1ColorId"
          type="color"
          :value="game.color1"
          @input="game.setColor1($event.target.value)"
        />
        <label :for="p1HexId" class="sr-only">Player 1 hex value</label>
        <input
          :id="p1HexId"
          type="text"
          class="color-hex"
          :value="game.color1"
          maxlength="7"
          aria-label="Player 1 hexadecimal color"
          @change="updateColor1($event.target.value)"
        />
      </div>

      <button
        class="swap-btn"
        title="Swap colors"
        aria-label="Swap player colors"
        @click="game.swapColors()"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="1.2em"
          viewBox="0 -960 960 960"
          width="1.2em"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            d="M280-120 80-320l200-200 57 56-104 104h607v80H233l104 104-57 56Zm400-320-57-56 104-104H120v-80h607L623-784l57-56 200 200-200 200Z"
          />
        </svg>
      </button>

      <div class="color-control-group">
        <label :for="p2ColorId" class="sr-only">Player 2 color picker</label>
        <input
          :id="p2ColorId"
          type="color"
          :value="game.color2"
          @input="game.setColor2($event.target.value)"
        />
        <label :for="p2HexId" class="sr-only">Player 2 hex value</label>
        <input
          :id="p2HexId"
          type="text"
          class="color-hex"
          :value="game.color2"
          maxlength="7"
          aria-label="Player 2 hexadecimal color"
          @change="updateColor2($event.target.value)"
        />
      </div>
    </div>

    <div v-if="presets.length" class="presets" aria-label="Saved color presets">
      <div v-for="(preset, i) in presets" :key="i" class="preset-item">
        <button
          class="preset-swatch"
          :title="`Apply preset ${preset.name}`"
          :aria-label="`Apply preset ${preset.name}`"
          @click="applyPreset(preset)"
        >
          <span class="swatch-dot" :style="{backgroundColor: preset.color1}" />
          <span class="swatch-dot" :style="{backgroundColor: preset.color2}" />
        </button>
        <button
          class="preset-remove"
          :title="`Remove preset ${preset.name}`"
          :aria-label="`Remove preset ${preset.name}`"
          @click="removePreset(i)"
        >
          ×
        </button>
      </div>
    </div>
    <button class="save-preset-btn" @click="savePreset">+ Save preset</button>
  </section>
</template>

<script setup>
import {ref, useId} from 'vue';
import {useGameStore} from '@/stores/game';

const game = useGameStore();

const p1ColorId = useId();
const p1HexId = useId();
const p2ColorId = useId();
const p2HexId = useId();

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
</script>

<style scoped>
.info-card {
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
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

.color-control-group {
  display: flex;
  align-items: center;
  gap: 0.4rem;

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

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
</style>
