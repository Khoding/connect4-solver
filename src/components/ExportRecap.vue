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
  <div class="info-card">
    <div class="card-tabs">
      <button :class="{active: cardTab === 'export'}" @click="cardTab = 'export'">Export</button>
      <button :class="{active: cardTab === 'import'}" @click="cardTab = 'import'">Import</button>
    </div>

    <template v-if="cardTab === 'export'">
      <p class="dim recap-summary">
        <template v-if="game.gameOver">
          {{ recap.summary.result }} · {{ recap.summary.totalPlies }} plies<template
            v-if="recap.summary.accuracy != null"
          >
            · {{ recap.summary.accuracy }}% accuracy</template
          >
        </template>
        <template v-else-if="game.totalMoves === 0"> Start a game to export a recap. </template>
        <template v-else> Declare a resignation or finish the game to export a recap. </template>
      </p>
      <div v-if="!game.gameOver && game.totalMoves > 0" class="resign-actions">
        <button @click="game.resign(1)">P1 resigned</button>
        <button @click="game.resign(2)">P2 resigned</button>
      </div>
      <div v-if="game.resignedPlayer" class="resign-badge">
        <span>Player {{ game.resignedPlayer }} resigned</span>
        <button class="resign-undo" @click="game.undoResign()">Undo</button>
      </div>
      <div class="recap-actions">
        <button class="recap-primary" :disabled="!game.gameOver" @click="open = true">
          View recap
        </button>
        <button :disabled="!game.gameOver" @click="quickCopyText">
          {{ quickCopied ? 'Copied!' : 'Copy text' }}
        </button>
      </div>
    </template>

    <template v-else>
      <p class="dim recap-summary">Paste any text containing column numbers (1–7) to load a game.</p>
      <textarea
        v-model="importInput"
        class="import-textarea"
        placeholder="e.g. 45627346475461456575617"
        rows="3"
        spellcheck="false"
      />
      <div class="recap-actions">
        <button class="recap-primary" :disabled="!parsedMoves" @click="doImport">
          Load{{ parsedMoves ? ` (${parsedMoves.length} moves)` : '' }}
        </button>
      </div>
    </template>
  </div>

  <Teleport to="body">
    <div v-if="open" class="recap-backdrop" @click="close">
      <div class="recap-modal" role="dialog" aria-label="Game recap" @click.stop>
        <header class="recap-modal-head">
          <h2>Game recap</h2>
          <button class="recap-close" title="Close (Esc)" @click="close">×</button>
        </header>

        <div class="recap-tabs">
          <button :class="{active: mode === 'image'}" @click="mode = 'image'">Image</button>
          <button :class="{active: mode === 'text'}" @click="mode = 'text'">Text</button>
        </div>

        <div class="recap-preview" :class="{'is-text': mode === 'text'}">
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div v-if="mode === 'image'" class="recap-svg" v-html="cardSvg" />
          <pre v-else class="recap-text">{{ text }}</pre>
        </div>

        <footer class="recap-modal-foot">
          <template v-if="mode === 'image'">
            <span class="recap-foot-label">Download as</span>
            <div class="recap-foot-btns">
              <button :disabled="busy" @click="download('svg')">SVG</button>
              <button :disabled="busy" @click="download('png')">PNG</button>
              <button :disabled="busy" @click="download('jpeg')">JPEG</button>
              <button class="recap-primary" :disabled="busy" @click="copyImage">
                {{ imgCopied ? 'Copied!' : 'Copy image' }}
              </button>
            </div>
          </template>
          <template v-else>
            <div class="recap-foot-btns">
              <button @click="copyTextBtn">{{ textCopied ? 'Copied!' : 'Copy text' }}</button>
              <button class="recap-primary" @click="download('txt')">Download .txt</button>
            </div>
          </template>
        </footer>

        <p v-if="note" class="recap-note">{{ note }}</p>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import {ref, computed, watch, onUnmounted} from 'vue';
import {useGameStore} from '@/stores/game';
import * as Recap from '@/utils/recap';

const game = useGameStore();

const open = ref(false);
const mode = ref('image');
const busy = ref(false);
const note = ref('');
const quickCopied = ref(false);
const textCopied = ref(false);
const imgCopied = ref(false);

const cardTab = ref('export');
const importInput = ref('');

const parsedMoves = computed(() => {
  const input = importInput.value;
  const movesLine = input.match(/^Moves:\s+([1-7]+)/m);
  const raw = movesLine ? movesLine[1] : input.replace(/[^1-7]/g, '');
  return raw || null;
});

function doImport() {
  if (!parsedMoves.value) return;
  const url = new URL(window.location.href);
  url.searchParams.set('pos', parsedMoves.value);
  window.location.assign(url.toString());
}

const recap = computed(() =>
  Recap.buildRecap({
    board: game.fullBoard,
    moves: game.moveHistory,
    moveScores: game.moveScores,
    moveBestScores: game.moveBestScores,
    moveBestCols: game.moveBestCols,
    winner: game.winner,
    winningCells: game.fullWinLine ?? [],
    resignedPlayer: game.resignedPlayer,
    color1: game.color1,
    color2: game.color2,
  }),
);

const card = computed(() => Recap.recapCardSvg(recap.value));
const cardSvg = computed(() => card.value.svg);
const text = computed(() => Recap.recapToText(recap.value));

function flash(flag) {
  flag.value = true;
  setTimeout(() => (flag.value = false), 1500);
}

function close() {
  open.value = false;
  note.value = '';
}

async function quickCopyText() {
  try {
    await Recap.copyText(Recap.recapToText(recap.value));
    flash(quickCopied);
  } catch {
    /* clipboard unavailable */
  }
}

async function copyTextBtn() {
  try {
    await Recap.copyText(text.value);
    flash(textCopied);
  } catch {
    note.value = 'Copy failed — your browser blocked clipboard access.';
  }
}

async function copyImage() {
  busy.value = true;
  note.value = '';
  try {
    const blob = await Recap.svgToRaster(cardSvg.value, 'png', 2);
    await Recap.copyImage(blob);
    flash(imgCopied);
  } catch {
    note.value = 'Image copy unsupported here — use Download instead.';
  } finally {
    busy.value = false;
  }
}

async function download(format) {
  busy.value = true;
  note.value = '';
  try {
    if (format === 'svg') {
      Recap.downloadBlob(Recap.svgToBlob(cardSvg.value), Recap.filenameFor(recap.value, 'svg'));
    } else if (format === 'txt') {
      Recap.downloadText(text.value, Recap.filenameFor(recap.value, 'txt'));
    } else {
      const ext = format === 'jpeg' ? 'jpg' : 'png';
      const blob = await Recap.svgToRaster(cardSvg.value, format, 2);
      Recap.downloadBlob(blob, Recap.filenameFor(recap.value, ext));
    }
  } catch {
    note.value = 'Export failed.';
  } finally {
    busy.value = false;
  }
}

/* Close on Escape while the modal is open. */
function onKey(e) {
  if (e.key === 'Escape') close();
}
watch(open, (isOpen) => {
  if (isOpen) window.addEventListener('keydown', onKey);
  else window.removeEventListener('keydown', onKey);
});
onUnmounted(() => window.removeEventListener('keydown', onKey));
</script>

<style scoped>
.card-tabs {
  display: flex;
  gap: 0.25rem;
  margin-block-end: 0.5rem;
  padding: 3px;
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);

  & button {
    flex: 1;
    padding: 5px 10px;
    border: none;
    border-radius: calc(var(--radius-sm) - 2px);
    background-color: transparent;
    color: var(--color-text-dim);
    font-size: 0.85rem;
    cursor: pointer;
    transition:
      background-color 0.15s,
      color 0.15s;

    &.active {
      background-color: var(--color-surface-alt);
      color: var(--color-text);
    }
  }
}

.import-textarea {
  inline-size: 100%;
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
  color: var(--color-text);
  font-size: 0.85rem;
  font-family: var(--font-mono);
  resize: vertical;
  box-sizing: border-box;
  transition: border-color 0.15s;

  &::placeholder {
    color: var(--color-text-dim);
    opacity: 0.6;
  }

  &:focus {
    border-color: var(--color-accent);
    outline: none;
  }
}

.import-note {
  margin: 0;
  color: var(--color-text-dim);
  font-size: 0.8rem;
}

.recap-summary {
  margin-block: 0.25rem 0.5rem;
}

.resign-actions {
  display: flex;
  gap: 0.5rem;
  margin-block-end: 0.5rem;

  & button {
    flex: 1;
    padding: 6px 10px;
    border: 1px solid color-mix(in oklch, var(--color-border), oklch(0.65 0.2 25) 30%);
    border-radius: var(--radius-sm);
    background-color: var(--color-surface);
    color: oklch(0.65 0.2 25);
    font-size: 0.85rem;
    cursor: pointer;
    transition:
      background-color 0.15s,
      border-color 0.15s;

    &:hover {
      border-color: oklch(0.65 0.2 25);
      background-color: oklch(0.65 0.2 25 / 0.1);
    }
  }
}

.resign-badge {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-block-end: 0.5rem;
  padding: 6px 10px;
  border: 1px solid oklch(0.65 0.2 25 / 0.5);
  border-radius: var(--radius-sm);
  background-color: oklch(0.65 0.2 25 / 0.08);
  color: oklch(0.75 0.15 25);
  font-size: 0.85rem;
}

.resign-undo {
  padding: 2px 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
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

.recap-actions {
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
    transition:
      background-color 0.15s,
      border-color 0.15s;

    &:hover:not(:disabled) {
      background-color: var(--color-surface-alt);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.3;
    }
  }
}

.recap-primary {
  border-color: color-mix(in oklch, var(--color-border), var(--color-accent) 40%) !important;
  background-color: color-mix(in oklch, var(--color-accent), transparent 85%) !important;
  color: var(--color-accent) !important;

  &:hover:not(:disabled) {
    border-color: var(--color-accent) !important;
    background-color: color-mix(in oklch, var(--color-accent), transparent 75%) !important;
  }
}

.recap-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(0.5rem, 3vw, 2rem);
  background-color: oklch(0 0 0 / 0.6);
  backdrop-filter: blur(4px);
}

.recap-modal {
  display: flex;
  flex-direction: column;
  inline-size: min(680px, 100%);
  max-block-size: 92dvh;
  padding: clamp(0.75rem, 2vw, 1.25rem);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md, 12px);
  background-color: var(--color-bg);
  gap: 0.75rem;
}

.recap-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;

  & h2 {
    margin: 0;
    font-size: clamp(1.1rem, 3vw, 1.4rem);
  }
}

.recap-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 32px;
  block-size: 32px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
  color: var(--color-text-dim);
  font-size: 1.3rem;
  line-height: 1;
  cursor: pointer;
  transition:
    color 0.15s,
    border-color 0.15s;

  &:hover {
    border-color: oklch(0.6 0.22 25);
    color: var(--color-text);
  }
}

.recap-tabs {
  display: flex;
  gap: 0.25rem;
  padding: 3px;
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);

  & button {
    flex: 1;
    padding: 6px 12px;
    border: none;
    border-radius: calc(var(--radius-sm) - 2px);
    background-color: transparent;
    color: var(--color-text-dim);
    font-size: 0.9rem;
    cursor: pointer;
    transition:
      background-color 0.15s,
      color 0.15s;

    &.active {
      background-color: var(--color-surface-alt);
      color: var(--color-text);
    }
  }
}

.recap-preview {
  display: flex;
  flex: 1;
  align-items: flex-start;
  justify-content: center;
  min-block-size: 0;
  padding: clamp(0.5rem, 2vw, 1rem);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
  overflow: auto;

  &.is-text {
    align-items: stretch;
  }
}

.recap-svg {
  inline-size: 100%;

  & :deep(svg) {
    display: block;
    inline-size: 100%;
    block-size: auto;
  }
}

.recap-text {
  margin: 0;
  inline-size: 100%;
  color: var(--color-text);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  white-space: pre;
  overflow-x: auto;
}

.recap-modal-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
}

.recap-foot-label {
  color: var(--color-text-dim);
  font-size: 0.85rem;
}

.recap-foot-btns {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;

  & button {
    padding: 8px 14px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background-color: var(--color-surface);
    color: var(--color-text);
    font-size: 0.9rem;
    cursor: pointer;
    transition:
      background-color 0.15s,
      border-color 0.15s;

    &:hover:not(:disabled) {
      background-color: var(--color-surface-alt);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.4;
    }
  }
}

.recap-note {
  margin: 0;
  color: oklch(0.8 0.12 70);
  font-size: 0.8rem;
}
</style>
