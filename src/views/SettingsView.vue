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
      <h1>Customization <span class="subtitle">Settings</span></h1>
      <p class="tagline">Toggle workspace elements to build your perfect Connect 4 interface.</p>
    </header>

    <div class="settings-layout">
      <!-- Controls column -->
      <section class="settings-controls-pane">
        <div class="info-card quick-actions-card">
          <h3>Quick configurations</h3>
          <div class="quick-btns">
            <button class="action-btn" @click="showAll">Show everything</button>
            <button class="action-btn minimalist-btn" @click="hideAll">
              Hide everything (Minimalist)
            </button>
          </div>
        </div>

        <div class="info-card">
          <h3>Toggle Elements</h3>
          <fieldset class="toggles-grid">
            <legend class="sr-only">Toggle UI elements</legend>
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
                <span class="toggle-label">{{ item.label }}</span>
                <span class="toggle-desc">{{ item.description }}</span>
              </div>
            </label>
          </fieldset>
        </div>

        <div class="back-navigation">
          <RouterLink to="/" class="back-btn">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="1.2em"
              viewBox="0 -960 960 960"
              width="1.2em"
              fill="currentColor"
            >
              <path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" />
            </svg>
            Back to Solver
          </RouterLink>
        </div>
      </section>

      <!-- App Mockup Preview column -->
      <section class="settings-preview-pane">
        <span class="preview-explanation">Interactive App Preview</span>
        <div class="mini-app-frame" :style="{'--p1-color': game.color1, '--p2-color': game.color2}">
          <!-- Header block -->
          <div class="mini-head-block" :class="{'is-disabled': game.hideHeader}">
            <span class="mini-title">Connect 4 <span class="light">Solver</span></span>
            <span class="mini-desc">Follow suggestions.</span>
            <div v-if="game.hideHeader" class="mini-status-overlay">HIDDEN</div>
          </div>

          <!-- Main Layout emulation -->
          <div class="mini-main-block">
            <!-- Board column -->
            <div class="mini-board-column">
              <!-- Always open board grid -->
              <div class="mini-board-wrapper">
                <span class="mini-badge-always-visible">always visible</span>
                <div class="mini-board-columns-header">
                  <span
                    v-for="n in 7"
                    :key="n"
                    class="mini-col-num"
                    :class="{suggested: n === 4}"
                    >{{ n }}</span
                  >
                </div>
                <div class="mini-board-grid">
                  <div v-for="r in 4" :key="r" class="mini-board-row">
                    <div
                      v-for="c in 5"
                      :key="c"
                      class="mini-board-cell"
                      :class="{
                        p1: r === 4 && (c === 2 || c === 3),
                        p2: r === 4 && c === 4,
                        winner: r === 4 && c === 1,
                      }"
                    />
                  </div>
                </div>
              </div>

              <!-- Indicators with auto play buttons -->
              <div class="mini-indicators" :class="{'is-disabled': game.hideAutoplay}">
                <div class="mini-p-card">
                  <span class="p1">P1</span>
                  <span class="mini-indicator-auto" :class="{'is-disabled': game.hideAutoplay}"
                    >Auto</span
                  >
                </div>
                <span class="mini-indicator-both" :class="{'is-disabled': game.hideAutoplay}"
                  >Auto both</span
                >
                <div class="mini-p-card">
                  <span class="mini-indicator-auto" :class="{'is-disabled': game.hideAutoplay}"
                    >Auto</span
                  >
                  <span class="p2">P2</span>
                </div>
                <div v-if="game.hideAutoplay" class="mini-status-overlay">HIDDEN</div>
              </div>

              <!-- Meter evaluation bar -->
              <div class="mini-meter-block" :class="{'is-disabled': game.hideEvalBar}">
                <div class="mini-meter-ticks">
                  <div class="tick"></div>
                  <div class="tick centre"></div>
                  <div class="tick"></div>
                </div>
                <div class="mini-meter-bar" />
                <div v-if="game.hideEvalBar" class="mini-status-overlay">HIDDEN</div>
              </div>
            </div>

            <!-- Sidebar elements -->
            <div class="mini-sidebar">
              <!-- Move sequence -->
              <div class="mini-section-card" :class="{'is-disabled': game.hideMoveSequence}">
                <span class="mini-card-lbl">Move Sequence</span>
                <div class="mini-dots-row">
                  <span class="mini-p1-dot">1: 4</span>
                  <span class="mini-p2-dot">2: 3</span>
                </div>
                <div v-if="game.hideMoveSequence" class="mini-status-overlay">HIDDEN</div>
              </div>

              <!-- Reset box (Always visible) -->
              <div class="mini-section-card mini-reset-card">
                <span class="mini-card-lbl">Controls</span>
                <div class="mini-row-flex">
                  <span class="mini-reset-pill">Reset</span>
                  <span class="mini-badge-always-lbl">always visible</span>
                </div>
              </div>

              <!-- Navigation steps -->
              <div class="mini-section-card" :class="{'is-disabled': game.hideNavigation}">
                <div class="mini-row-flex">
                  <span class="mini-pill">Back</span>
                  <span class="mini-pill">Forward</span>
                </div>
                <div v-if="game.hideNavigation" class="mini-status-overlay">HIDDEN</div>
              </div>

              <!-- Replay -->
              <div class="mini-section-card" :class="{'is-disabled': game.hideReplay}">
                <span class="mini-pill accent">Replay</span>
                <div v-if="game.hideReplay" class="mini-status-overlay">HIDDEN</div>
              </div>

              <!-- Export / import -->
              <div class="mini-section-card" :class="{'is-disabled': game.hideExportImport}">
                <span class="mini-card-lbl">Export / Import</span>
                <div class="mini-row-flex text-decor">
                  <span>Export</span>
                  <span>Import</span>
                </div>
                <div v-if="game.hideExportImport" class="mini-status-overlay">HIDDEN</div>
              </div>

              <!-- Colors -->
              <div class="mini-section-card" :class="{'is-disabled': game.hideColors}">
                <span class="mini-card-lbl">Colors</span>
                <div class="mini-row-flex swatches">
                  <span class="p1-swatch">P1</span>
                  <span class="p2-swatch">P2</span>
                </div>
                <div v-if="game.hideColors" class="mini-status-overlay">HIDDEN</div>
              </div>

              <!-- Solver ready indicator -->
              <div class="mini-section-card" :class="{'is-disabled': game.hideSolverStatus}">
                <span class="mini-card-lbl">Solver status</span>
                <span class="mini-solver-ready">Ready (with opening book)</span>
                <div v-if="game.hideSolverStatus" class="mini-status-overlay">HIDDEN</div>
              </div>
            </div>
          </div>

          <!-- Footer block -->
          <div class="mini-foot-block" :class="{'is-disabled': game.hideFooter}">
            <span class="mini-foot-txt">Solver by Pascal Pons · AGPL-3.0</span>
            <div v-if="game.hideFooter" class="mini-status-overlay">HIDDEN</div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import {onMounted} from 'vue';
import {useGameStore} from '@/stores/game';

const game = useGameStore();

onMounted(() => {
  game.init();
});

const settingsList = [
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
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.quick-actions-card {
  & h3 {
    margin-block-end: 0.75rem;
  }
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
  min-inline-size: 180px;
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
  margin-block-start: 1rem;
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

/* Miniature app simulator frame */
.mini-app-frame {
  display: flex;
  position: relative;
  flex-direction: column;
  aspect-ratio: 16 / 15;
  padding: 12px;
  overflow: hidden;
  gap: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-bg);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

/* Overlays on blocks that are hidden */
.is-disabled {
  filter: grayscale(0.85);
  opacity: 0.15;
  pointer-events: none;
}

.mini-status-overlay {
  display: flex;
  z-index: 5;
  position: absolute;
  align-items: center;
  justify-content: center;
  inset: 0;
  border-radius: inherit;
  backdrop-filter: blur(1px);
  background-color: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-weight: 700;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
}

/* Miniature subcomponents */
.mini-head-block {
  position: relative;
  padding-block-end: 2px;
  border-block-end: 1px solid rgba(255, 255, 255, 0.04);
  text-align: center;
}

.mini-title {
  color: #fff;
  font-weight: 700;
  font-size: 0.85rem;

  & .light {
    color: var(--color-text-dim);
    font-weight: 400;
  }
}

.mini-desc {
  display: block;
  color: var(--color-text-dim);
  font-size: 0.6rem;
}

.mini-main-block {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  flex: 1;
  align-items: start;
  overflow: hidden;
  gap: 12px;
}

.mini-board-column {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mini-board-wrapper {
  display: flex;
  position: relative;
  flex-direction: column;
  padding: 6px;
  gap: 4px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
}

.mini-badge-always-visible {
  position: absolute;
  top: 4px;
  right: 4px;
  padding: 1px 4px;
  border: 1px solid oklch(0.65 0.2 25 / 0.3);
  border-radius: 3px;
  background-color: oklch(0.65 0.2 25 / 0.15);
  color: oklch(0.7 0.22 25);
  font-weight: 700;
  font-size: 0.5rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  pointer-events: none;
}

.mini-board-columns-header {
  display: flex;
  justify-content: space-around;
  padding-inline: 4px;
}

.mini-col-num {
  color: var(--color-text-dim);
  font-weight: 700;
  font-size: 0.55rem;

  &.suggested {
    color: var(--p1-color);
    text-shadow: 0 0 4px var(--p1-color);
  }
}

.mini-board-grid {
  display: flex;
  flex-direction: column;
  padding: 4px;
  gap: 2px;
  border: 1px solid rgb(255 255 255 / 0.05);
  border-radius: var(--radius-sm);
  background-color: var(--color-empty);
}

.mini-board-row {
  display: flex;
  justify-content: space-around;
}

.mini-board-cell {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.08);

  &.p1 {
    background-color: var(--p1-color);
    box-shadow: 0 0 4px var(--p1-color);
  }

  &.p2 {
    background-color: var(--p2-color);
    box-shadow: 0 0 4px var(--p2-color);
  }

  &.winner {
    background-color: var(--p1-color);
    animation: mini-pulse 1s infinite alternate;
  }
}

@keyframes mini-pulse {
  from {
    transform: scale(1);
    opacity: 0.7;
  }
  to {
    transform: scale(1.15);
    opacity: 1;
  }
}

.mini-indicators {
  display: flex;
  position: relative;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

.mini-p-card {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 700;
  font-size: 0.55rem;

  & .p1 {
    color: var(--p1-color);
  }

  & .p2 {
    color: var(--p2-color);
  }
}

.mini-indicator-auto {
  padding: 1px 4px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: rgba(255, 255, 255, 0.08);
  color: var(--color-text-dim);
  font-size: 0.5rem;
}

.mini-indicator-both {
  padding: 1px 6px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-sm);
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--color-text-dim);
  font-size: 0.5rem;
}

.mini-meter-block {
  display: flex;
  position: relative;
  flex-direction: column;
  gap: 2px;
}

.mini-meter-ticks {
  display: flex;
  justify-content: space-between;
}

.tick {
  width: 1px;
  height: 3px;
  background-color: var(--color-border);

  &.centre {
    background-color: var(--color-text-dim);
  }
}

.mini-meter-bar {
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--p1-color) 45%, var(--p2-color) 55%);
}

.mini-sidebar {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  gap: 6px;
}

.mini-section-card {
  display: flex;
  position: relative;
  flex-direction: column;
  padding: 4px;
  gap: 3px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
}

.mini-reset-card {
  border-style: solid;
  border-color: oklch(0.65 0.2 25 / 0.25);
}

.mini-card-lbl {
  color: var(--color-text-dim);
  font-weight: 700;
  font-size: 0.5rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.mini-dots-row {
  display: flex;
  gap: 4px;
}

.mini-p1-dot {
  color: var(--p1-color);
  font-size: 0.45rem;
  font-family: var(--font-mono);
}

.mini-p2-dot {
  color: var(--p2-color);
  font-size: 0.45rem;
  font-family: var(--font-mono);
}

.mini-row-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;

  &.swatches {
    justify-content: flex-start;
  }

  &.text-decor {
    color: var(--color-text-dim);
    font-size: 0.45rem;
    text-decoration: underline;
  }
}

.mini-reset-pill {
  padding: 1px 4px;
  border: 1px solid oklch(0.65 0.2 25 / 0.2);
  border-radius: 3px;
  background-color: oklch(0.65 0.2 25 / 0.1);
  color: oklch(0.7 0.22 25);
  font-weight: 700;
  font-size: 0.5rem;
}

.mini-badge-always-lbl {
  padding: 1px 3px;
  border: 1px solid oklch(0.65 0.2 25 / 0.3);
  border-radius: 3px;
  background-color: oklch(0.65 0.2 25 / 0.15);
  color: oklch(0.7 0.22 25);
  font-weight: 700;
  font-size: 0.45rem;
  text-transform: uppercase;
}

.mini-pill {
  flex: 1;
  padding: 1px 4px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--color-text);
  font-size: 0.5rem;
  text-align: center;

  &.accent {
    border-color: var(--color-accent - 0.2);
    color: var(--color-accent);
  }
}

.p1-swatch {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  background-color: var(--p1-color);
  color: #fff;
  font-weight: 700;
  font-size: 0.4rem;
}

.p2-swatch {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  background-color: var(--p2-color);
  color: #000;
  font-weight: 700;
  font-size: 0.4rem;
}

.mini-solver-ready {
  color: var(--color-text-dim);
  font-size: 0.45rem;
}

.mini-foot-block {
  position: relative;
  padding-block-start: 4px;
  border-block-start: 1px solid rgba(255, 255, 255, 0.04);
  text-align: center;
}

.mini-foot-txt {
  color: var(--color-text-dim);
  font-size: 0.5rem;
}
</style>
