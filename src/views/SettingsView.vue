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
  <div class="settings-view">
    <header class="settings-header">
      <h1>
        {{ $t('settings.header.title') }}
        <span class="subtitle">{{ $t('settings.header.subtitle') }}</span>
      </h1>
      <p class="tagline">{{ $t('settings.header.tagline') }}</p>
    </header>

    <div class="settings-layout">
      <!-- Controls column -->
      <section class="settings-controls-pane">
        <!-- Language Selector Card -->
        <section class="info-card language-card" aria-labelledby="language-heading">
          <h2 id="language-heading" class="card-heading">{{ $t('settings.language.title') }}</h2>
          <div class="quick-btns">
            <BaseButton
              v-for="l in ['en', 'fr', 'de']"
              :key="l"
              class="action-btn"
              :variant="locale === l ? 'accent' : 'default'"
              @click="changeLocale(l)"
            >
              {{ l === 'en' ? 'English' : l === 'fr' ? 'Français' : 'Deutsch' }}
            </BaseButton>
          </div>
        </section>

        <section class="info-card quick-actions-card" aria-labelledby="quick-config-heading">
          <h2 id="quick-config-heading" class="card-heading">
            {{ $t('settings.quick_config.title') }}
          </h2>
          <div class="quick-btns">
            <BaseButton class="action-btn" @click="showAll">{{
              $t('settings.quick_config.show_all')
            }}</BaseButton>
            <BaseButton class="action-btn" variant="danger" @click="hideAll">
              {{ $t('settings.quick_config.hide_all') }}
            </BaseButton>
            <BaseButton class="action-btn" variant="accent" @click="applyRecommended">
              {{ $t('settings.quick_config.recommended') }}
            </BaseButton>
          </div>
        </section>

        <section class="info-card" aria-labelledby="toggle-elements-heading">
          <h2 id="toggle-elements-heading" class="card-heading">
            {{ $t('settings.toggle_elements.title') }}
          </h2>
          <fieldset class="toggles-grid">
            <legend class="sr-only">{{ $t('settings.toggle_elements.title') }}</legend>
            <label
              v-for="item in settingsList"
              :key="item.key"
              class="setting-toggle-row"
              :class="{'is-active': !game[item.key]}"
            >
              <div class="toggle-switch">
                <input
                  type="checkbox"
                  :checked="game[item.key]"
                  @change="game[item.setter]($event.target.checked)"
                />
                <span class="toggle-slider"></span>
              </div>
              <div class="toggle-info">
                <span class="toggle-label">{{ $t(`settings.items.${item.key}.label`) }}</span>
                <span class="toggle-desc">{{ $t(`settings.items.${item.key}.desc`) }}</span>
              </div>
            </label>
          </fieldset>
        </section>

        <section class="info-card aside-order-card" aria-labelledby="aside-order-heading">
          <div class="card-header-row">
            <h2 id="aside-order-heading" class="card-heading">
              {{ $t('settings.aside_order.title') }}
            </h2>
            <button class="reset-order-btn" @click="game.resetAsideOrder">
              {{ $t('settings.aside_order.reset') }}
            </button>
          </div>
          <p class="card-desc">
            {{ $t('settings.aside_order.desc') }}
          </p>
          <div class="reorder-list">
            <div
              v-for="(item, index) in game.asideOrder"
              :key="item"
              class="reorder-item"
              draggable="true"
              @dragstart="onDragStart(index, $event)"
              @dragover.prevent="onDragOver(index, $event)"
              @drop="onDrop(index, $event)"
              @dragend="onDragEnd"
              :class="{'is-dragging': draggingIndex === index}"
            >
              <div class="drag-handle" aria-hidden="true">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="1.2em"
                  height="1.2em"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="9" cy="12" r="1" />
                  <circle cx="9" cy="5" r="1" />
                  <circle cx="9" cy="19" r="1" />
                  <circle cx="15" cy="12" r="1" />
                  <circle cx="15" cy="5" r="1" />
                  <circle cx="15" cy="19" r="1" />
                </svg>
              </div>
              <span class="reorder-label">{{ asideLabel(item) }}</span>
              <div class="reorder-actions">
                <button
                  class="arrow-btn"
                  :disabled="index === 0"
                  @click="game.moveAsideItem(index, -1)"
                  :title="$t('settings.aside_order.move_up')"
                  :aria-label="$t('settings.aside_order.move_up')"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="1.2em"
                    height="1.2em"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="m18 15-6-6-6 6" />
                  </svg>
                </button>
                <button
                  class="arrow-btn"
                  :disabled="index === game.asideOrder.length - 1"
                  @click="game.moveAsideItem(index, 1)"
                  :title="$t('settings.aside_order.move_down')"
                  :aria-label="$t('settings.aside_order.move_down')"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="1.2em"
                    height="1.2em"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </section>
      </section>

      <!-- App Mockup Preview column -->
      <section class="settings-preview-pane">
        <span class="preview-explanation">{{ $t('settings.preview.title') }}</span>
        <MiniAppPreview />
      </section>

      <div class="back-navigation">
        <BaseButton to="/" variant="win" class="back-btn">
          <template #icon>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1.2em"
              height="1.2em"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
          </template>
          {{ $t('settings.back_btn') }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import {onMounted, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {useGameStore} from '@/stores/game';
import BaseButton from '@/components/BaseButton.vue';
import MiniAppPreview from '@/components/MiniAppPreview.vue';

const game = useGameStore();
const {locale, t} = useI18n();

function changeLocale(l) {
  locale.value = l;
  try {
    localStorage.setItem('c4_locale', l);
  } catch {
    /* localStorage unavailable */
  }
}

onMounted(() => {
  game.init();
});

const draggingIndex = ref(null);

function onDragStart(index, event) {
  draggingIndex.value = index;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', index);
}

function onDragOver(index, event) {
  event.dataTransfer.dropEffect = 'move';
}

function onDrop(index, event) {
  if (draggingIndex.value === null) return;
  const fromIndex = draggingIndex.value;
  if (fromIndex !== index) {
    const list = [...game.asideOrder];
    const [moved] = list.splice(fromIndex, 1);
    list.splice(index, 0, moved);
    game.setAsideOrder(list);
  }
}

function onDragEnd() {
  draggingIndex.value = null;
}

function asideLabel(key) {
  return t(`settings.aside.${key}`) || key;
}

const settingsList = [
  {
    key: 'hideLearn',
    setter: 'setHideLearn',
    label: 'Hide Learn mode card',
    description:
      'Removes the Learn-mode card and its hints. Hide it while in Learn mode for a true no-help board.',
  },
  {
    key: 'hideHeader',
    setter: 'setHideHeader',
    label: 'Hide website header',
    description: 'Removes the top logo, title, and follow suggetions tagline.',
  },
  {
    key: 'hideMoveSequence',
    setter: 'setHideMoveSequence',
    label: 'Hide move sequence list',
    description: 'Removes the played column numbers log and the individual move scores.',
  },
  {
    key: 'hideScoreBar',
    setter: 'setHideScoreBar',
    label: 'Hide solver score bar',
    description: 'Removes the solver score row (+/−) displayed above the column buttons.',
  },
  {
    key: 'hideColumnHelp',
    setter: 'setHideColumnHelp',
    label: 'Hide column suggestion highlights',
    description: 'Stops highlighting which column the solver recommends above the board.',
  },
  {
    key: 'lockPredictions',
    setter: 'setLockPredictions',
    label: 'Lock predictive moves',
    description:
      'Turns the "wins in" status into plain text so predictive future moves can no longer be revealed.',
  },
  {
    key: 'hideAutoplay',
    setter: 'setHideAutoplay',
    label: 'Hide autoplayer buttons',
    description: 'Removes the individual "Auto" and global "Auto both" click options.',
  },
  {
    key: 'hideEvalBar',
    setter: 'setHideEvalBar',
    label: 'Hide evaluation bar/badges',
    description:
      'Hides the main horizontal board-balance graph and individual P1/P2 evaluation totals.',
  },
  {
    key: 'hideNavigation',
    setter: 'setHideNavigation',
    label: 'Hide navigation controls',
    description: 'Hides the "Back", "Forward" and "Latest" game evaluation and step buttons.',
  },
  {
    key: 'hideReplay',
    setter: 'setHideReplay',
    label: 'Hide replay system',
    description: 'Hides automatic playback controls ("Replay" and "Continue").',
  },
  {
    key: 'hideExportImport',
    setter: 'setHideExportImport',
    label: 'Hide Export & Import recap',
    description: 'Hides the modal preview, copy text, resignation triggers, and column loader.',
  },
  {
    key: 'hideColors',
    setter: 'setHideColors',
    label: 'Hide color editor & presets',
    description:
      'Hides swatches, preset database, custom Hex values inputs, and quick swap button.',
  },
  {
    key: 'hideSolverStatus',
    setter: 'setHideSolverStatus',
    label: 'Hide WASM solver status',
    description: 'Removes the running WebAssembly compiler and opening book diagnostic card.',
  },
  {
    key: 'hideFooter',
    setter: 'setHideFooter',
    label: 'Hide website footer',
    description: 'Removes citation details, licensing, and GitHub link sections from the bottom.',
  },
  {
    key: 'hideLangSelector',
    setter: 'setHideLangSelector',
    label: 'Hide language selector',
    description: 'Hides the EN/FR/DE language switcher independently of the footer.',
  },
];

function showAll() {
  settingsList.forEach(s => {
    game[s.setter](false);
  });
}

function hideAll() {
  settingsList.forEach(s => {
    game[s.setter](true);
  });
}

function applyRecommended() {
  game.applyRecommendedLayout();
}
</script>

<style scoped>
.settings-view {
  display: flex;
  flex-direction: column;
  max-inline-size: 1100px;
  margin-inline: auto;
  gap: clamp(1rem, 3vh, 2rem);
}

.settings-header {
  text-align: center;

  & h1 {
    font-weight: 700;
    font-size: clamp(1.4rem, min(3vw, 4vh), 2rem);
    letter-spacing: -0.02em;
  }
}

.subtitle {
  color: var(--color-text-dim);
  font-weight: 400;
}

.tagline {
  margin-block-start: 0.25rem;
  color: var(--color-text-dim);
  font-size: clamp(0.85rem, min(1.8vw, 2vh), 1rem);
}

.settings-layout {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  align-items: flex-start;
  gap: clamp(1rem, min(2vw, 2vh), 2.5rem);
}

@media (max-width: 850px) {
  .settings-layout {
    grid-template-columns: 1fr;
  }
}

/* Controls column styling */
.settings-controls-pane {
  container-name: controls-pane;
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  min-inline-size: 0;
  gap: 1.2rem;
}

.quick-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.action-btn {
  display: inline-flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-inline-size: min(180px, 100%);
  padding: 10px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
  color: var(--color-text);
  font-size: 0.9rem;
  cursor: pointer;
  transition:
    background-color 0.15s,
    border-color 0.15s,
    color 0.15s;

  &:hover {
    border-color: var(--color-accent);
    background-color: var(--color-surface-alt);
  }

  &.minimalist-btn {
    border-color: color-mix(in oklch, var(--color-border), oklch(0.65 0.2 25) 30%);
    color: oklch(0.65 0.2 25);

    &:hover {
      border-color: oklch(0.65 0.2 25);
      background-color: oklch(0.65 0.2 25 / 0.1);
    }
  }

  &.recommended-btn {
    border-color: color-mix(in oklch, var(--color-border), var(--color-accent) 40%);
    color: var(--color-accent);

    &:hover {
      border-color: var(--color-accent);
      background-color: color-mix(in oklch, var(--color-accent), transparent 90%);
    }
  }
}

/* Custom checkbox/toggle styles */
.toggles-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border: none;
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

.setting-toggle-row {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  gap: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  cursor: pointer;
  transition:
    border-color 0.2s,
    background-color 0.2s;
  user-select: none;

  &:hover {
    border-color: var(--color-accent);
    background-color: var(--color-surface-alt);
  }

  &.is-active {
    border-color: color-mix(in oklch, var(--color-border), var(--color-accent) 50%);
  }
}

/* The toggle switch container */
.toggle-switch {
  display: inline-block;
  position: relative;
  flex-shrink: 0;
  inline-size: 40px;
  block-size: 20px;
  margin-block-start: 2px;

  & input {
    width: 0;
    height: 0;
    opacity: 0;
  }
}

/* Slider styling */
.toggle-slider {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background-color: var(--color-empty);
  cursor: pointer;
  transition: 0.2s;

  &::before {
    position: absolute;
    bottom: 2px;
    left: 2px;
    inline-size: 14px;
    block-size: 14px;
    border-radius: 50%;
    background-color: var(--color-text-dim);
    content: '';
    transition: 0.2s;
  }
}

input:checked + .toggle-slider {
  border-color: oklch(0.65 0.2 25 / 0.5);
  background-color: color-mix(in oklch, var(--color-bg), oklch(0.65 0.2 25) 40%);

  &::before {
    transform: translateX(20px);
    background-color: oklch(0.65 0.2 25);
  }
}

input:focus-visible + .toggle-slider {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.toggle-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toggle-label {
  color: var(--color-text);
  font-weight: 500;
  font-size: 0.95rem;
}

.toggle-desc {
  color: var(--color-text-dim);
  font-size: 0.8rem;
}

.back-navigation {
  align-self: center;
  justify-self: center;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  padding: 10px 20px;
  gap: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
  color: var(--color-text);
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition:
    background-color 0.15s,
    border-color 0.15s;

  &:hover {
    border-color: var(--color-accent);
    background-color: var(--color-surface-alt);
    color: var(--color-win);
  }
}

/* Interactive Preview column styling */
.settings-preview-pane {
  display: flex;
  position: sticky;
  top: 1.5rem;
  flex-direction: column;
  min-inline-size: 0;
  gap: 0.5rem;
}

.preview-explanation {
  padding-inline-start: 4px;
  color: var(--color-text-dim);
  font-weight: 600;
  font-size: 0.85rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* Sidebar Reordering UI styling */
.card-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-block-end: 0.25rem;
}

.reset-order-btn {
  padding: 4px 8px;
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

.card-desc {
  margin-block-end: 0.75rem;
  color: var(--color-text-dim);
  font-size: 0.8rem;
}

.reorder-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.reorder-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  transition:
    transform 0.2s,
    box-shadow 0.2s,
    border-color 0.2s,
    background-color 0.2s;
  user-select: none;

  &:hover:not(.is-dragging) {
    border-color: var(--color-accent);
    background-color: var(--color-surface-alt);
  }

  &.is-dragging {
    border-style: dashed;
    border-color: var(--color-accent);
    opacity: 0.5;
  }
}

.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-inline-end: 0.75rem;
  color: var(--color-text-dim);
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

.reorder-label {
  flex: 1;
  color: var(--color-text);
  font-weight: 500;
  font-size: 0.9rem;
}

.reorder-actions {
  display: flex;
  gap: 0.4rem;
}

.arrow-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
  color: var(--color-text-dim);
  cursor: pointer;
  transition:
    background-color 0.15s,
    border-color 0.15s,
    color 0.15s;

  &:hover:not(:disabled) {
    border-color: var(--color-accent);
    background-color: var(--color-surface-alt);
    color: var(--color-text);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.25;
  }
}

/* Reorder items go vertical (label below handle + actions) when controls pane is narrow */
@container controls-pane (max-width: 480px) {
  .reorder-item {
    flex-wrap: wrap;
  }

  .drag-handle {
    order: 1;
  }

  .reorder-actions {
    order: 2;
    margin-inline-start: auto;
  }

  .reorder-label {
    flex-basis: 100%;
    order: 3;
    margin-inline-start: 0;
  }
}
</style>
