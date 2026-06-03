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
  <section class="info-card" :aria-label="$t('recap.aria')">
    <div class="card-tabs" role="tablist" :aria-label="$t('recap.tablist_aria')">
      <button
        role="tab"
        :aria-selected="cardTab === 'export'"
        aria-controls="export-panel"
        :class="{active: cardTab === 'export'}"
        @click="cardTab = 'export'"
      >
        {{ $t('recap.tab_export') }}
      </button>
      <button
        role="tab"
        :aria-selected="cardTab === 'import'"
        aria-controls="import-panel"
        :class="{active: cardTab === 'import'}"
        @click="cardTab = 'import'"
      >
        {{ $t('recap.tab_import') }}
      </button>
    </div>

    <div
      id="export-panel"
      role="tabpanel"
      :aria-label="$t('recap.export_panel_aria')"
      v-if="cardTab === 'export'"
    >
      <p class="dim recap-summary">
        <template v-if="game.gameOver">
          {{ recap.summary.result }} · {{ recap.summary.totalPlies }} {{ $t('recap.plies')
          }}<template v-if="recap.summary.accuracy != null">
            · {{ recap.summary.accuracy }}% {{ $t('recap.accuracy') }}</template
          >
        </template>
        <template v-else-if="game.totalMoves === 0"> {{ $t('recap.summary_start') }} </template>
        <template v-else> {{ $t('recap.summary_in_progress') }} </template>
      </p>
      <div v-if="!game.gameOver && game.totalMoves > 0" class="resign-actions">
        <button @click="game.resign(1)">{{ $t('recap.p1_resigned') }}</button>
        <button @click="game.resign(2)">{{ $t('recap.p2_resigned') }}</button>
      </div>
      <div v-if="game.resignedPlayer" class="resign-badge">
        <span>{{ $t('recap.player_resigned_status', {player: game.resignedPlayer}) }}</span>
        <button class="resign-undo" @click="game.undoResign()">{{ $t('recap.undo') }}</button>
      </div>
      <div class="recap-actions">
        <button class="recap-primary" :disabled="!game.gameOver" @click="open = true">
          {{ $t('recap.view') }}
        </button>
        <button :disabled="!game.gameOver" @click="quickCopyText">
          {{ quickCopied ? $t('recap.copied') : $t('recap.copy_text') }}
        </button>
      </div>
    </div>

    <div id="import-panel" role="tabpanel" :aria-label="$t('recap.import_panel_aria')" v-else>
      <p class="dim recap-summary">
        {{ $t('recap.import_instructions') }}
      </p>
      <textarea
        v-model="importInput"
        class="import-textarea"
        :placeholder="$t('recap.import_placeholder')"
        rows="3"
        spellcheck="false"
      />
      <div class="recap-actions">
        <button class="recap-primary" :disabled="!parsedMoves" @click="doImport">
          {{
            parsedMoves
              ? $t('recap.load_moves', {n: parsedMoves.length})
              : $t('recap.load_moves_simple')
          }}
        </button>
      </div>
    </div>
  </section>

  <Teleport to="body">
    <div v-if="open" class="recap-backdrop" @click="close">
      <div
        class="recap-modal"
        role="dialog"
        aria-modal="true"
        :aria-label="$t('recap.modal_aria')"
        @click.stop
      >
        <header class="recap-modal-head">
          <h2>{{ $t('recap.modal_title') }}</h2>
          <button class="recap-close" :title="$t('recap.close_title')" @click="close">×</button>
        </header>

        <div class="recap-controls">
          <div class="recap-tabs" role="tablist" :aria-label="$t('recap.modal_tablist_aria')">
            <button
              role="tab"
              :aria-selected="mode === 'image'"
              aria-controls="image-recap-panel"
              :class="{active: mode === 'image'}"
              @click="mode = 'image'"
            >
              {{ $t('recap.tab_image') }}
            </button>
            <button
              role="tab"
              :aria-selected="mode === 'text'"
              aria-controls="text-recap-panel"
              :class="{active: mode === 'text'}"
              @click="mode = 'text'"
            >
              {{ $t('recap.tab_text') }}
            </button>
          </div>

          <div
            class="recap-lang"
            role="group"
            :aria-label="$t('recap.export_language')"
            :title="$t('recap.export_language')"
          >
            <button
              v-for="l in LOCALES"
              :key="l"
              :class="{active: exportLocale === l}"
              :aria-pressed="exportLocale === l"
              :aria-label="`${$t('recap.export_language')}: ${l.toUpperCase()}`"
              @click="exportLocale = l"
            >
              {{ l.toUpperCase() }}
            </button>
          </div>
        </div>

        <div class="recap-preview" :class="{'is-text': mode === 'text'}">
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div
            id="image-recap-panel"
            role="tabpanel"
            :aria-label="$t('recap.image_panel_aria')"
            v-if="mode === 'image'"
            class="recap-svg"
            v-html="cardSvg"
          />
          <pre
            id="text-recap-panel"
            role="tabpanel"
            :aria-label="$t('recap.text_panel_aria')"
            v-else
            class="recap-text"
            >{{ text }}</pre
          >
        </div>

        <footer class="recap-modal-foot">
          <template v-if="mode === 'image'">
            <span class="recap-foot-label">{{ $t('recap.download_as') }}</span>
            <div class="recap-foot-btns">
              <button :disabled="busy" @click="download('svg')">SVG</button>
              <button :disabled="busy" @click="download('png')">PNG</button>
              <button :disabled="busy" @click="download('jpeg')">JPEG</button>
              <button class="recap-primary" :disabled="busy" @click="copyImage">
                {{ imgCopied ? $t('recap.copied') : $t('recap.copy_image') }}
              </button>
            </div>
          </template>
          <template v-else>
            <div class="recap-foot-btns">
              <button @click="copyTextBtn">
                {{ textCopied ? $t('recap.copied') : $t('recap.copy_text') }}
              </button>
              <button class="recap-primary" @click="download('txt')">
                {{ $t('recap.download_txt') }}
              </button>
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
import {useI18n} from 'vue-i18n';
import {useGameStore} from '@/stores/game';
import * as Recap from '@/utils/recap';

const game = useGameStore();
const {t, locale} = useI18n();

/* Language the recap is rendered/exported in — independent of the live UI so
   users can share a recap in a language other than the one they browse in.
   Defaults to the current UI locale and resets to it each time the modal opens. */
const LOCALES = ['en', 'fr', 'de'];
const exportLocale = ref(locale.value);

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

/* Build a recap in the given language from the current store state. The modal
   renders in `exportLocale`; the inline quick-copy uses the live UI locale. */
function recapIn(loc) {
  return Recap.buildRecap({
    board: game.fullBoard,
    moves: game.moveHistory,
    cols: game.COLS,
    rows: game.ROWS,
    moveScores: game.moveScores,
    moveBestScores: game.moveBestScores,
    moveBestCols: game.moveBestCols,
    winner: game.winner,
    winningCells: game.fullWinLine ?? [],
    resignedPlayer: game.resignedPlayer,
    color1: game.color1,
    color2: game.color2,
    locale: loc,
  });
}

const recap = computed(() => recapIn(exportLocale.value));

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
    await Recap.copyText(Recap.recapToText(recapIn(locale.value)));
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
    note.value = t('recap.copy_failed_clipboard');
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
    note.value = t('recap.image_copy_unsupported');
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
    note.value = t('recap.export_failed');
  } finally {
    busy.value = false;
  }
}

/* Close on Escape while the modal is open. */
function onKey(e) {
  if (e.key === 'Escape') close();
}
watch(open, isOpen => {
  if (isOpen) {
    exportLocale.value = locale.value;
    window.addEventListener('keydown', onKey);
  } else window.removeEventListener('keydown', onKey);
});
onUnmounted(() => window.removeEventListener('keydown', onKey));
</script>

<style scoped>
.card-tabs {
  display: flex;
  margin-block-end: 0.5rem;
  padding: 3px;
  gap: 0.25rem;
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
  box-sizing: border-box;
  inline-size: 100%;
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
  color: var(--color-text);
  font-size: 0.85rem;
  font-family: var(--font-mono);
  resize: vertical;
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

.recap-summary {
  margin-block: 0.25rem 0.5rem;
}

.resign-actions {
  display: flex;
  margin-block-end: 0.5rem;
  gap: 0.5rem;

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
  display: flex;
  z-index: 100;
  position: fixed;
  align-items: center;
  justify-content: center;
  inset: 0;
  padding: clamp(0.5rem, 3vw, 2rem);
  backdrop-filter: blur(4px);
  background-color: oklch(0 0 0 / 0.6);
}

.recap-modal {
  display: flex;
  flex-direction: column;
  inline-size: min(680px, 100%);
  max-block-size: 92dvh;
  padding: clamp(0.75rem, 2vw, 1.25rem);
  gap: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md, 12px);
  background-color: var(--color-bg);
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

.recap-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
}

.recap-tabs {
  display: flex;
  flex: 1;
  min-inline-size: 12rem;
  padding: 3px;
  gap: 0.25rem;
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

.recap-lang {
  display: inline-flex;
  padding: 3px;
  gap: 0.25rem;
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);

  & button {
    padding: 5px 10px;
    border: none;
    border-radius: calc(var(--radius-sm) - 2px);
    background-color: transparent;
    color: var(--color-text-dim);
    font-weight: 600;
    font-size: 0.8rem;
    cursor: pointer;
    transition:
      background-color 0.15s,
      color 0.15s;

    &:hover {
      color: var(--color-text);
    }

    &.active {
      background-color: var(--color-surface-alt);
      color: var(--color-accent);
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
  overflow: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);

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
  inline-size: 100%;
  margin: 0;
  overflow-x: auto;
  color: var(--color-text);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  white-space: pre;
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
