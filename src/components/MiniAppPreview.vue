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
  <div class="mini-app-frame" :style="{'--p1-color': game.color1, '--p2-color': game.color2}">
    <!-- Header block (Skeleton) -->
    <div v-if="!game.hideHeader" class="mini-head-block">
      <div class="skeleton-title" />
      <div class="skeleton-tagline" />
    </div>

    <!-- Main Layout emulation -->
    <div class="mini-main-block">
      <!-- Board column -->
      <div class="mini-board-column">
        <!-- Optional Score Bar -->
        <div v-if="!game.hideScoreBar" class="mini-score-bar">
          <div class="mini-score-cell win" />
          <div class="mini-score-cell draw" />
          <div class="mini-score-cell loss" />
        </div>

        <!-- Board Wrapper (Always visible) -->
        <div class="mini-board-wrapper">
          <!-- Column headers (Always visible) -->
          <div class="mini-board-columns-header">
            <span class="mini-col-num" :class="{suggested: !game.hideColumnHelp}">1</span>
            <span class="mini-col-num">2</span>
            <span class="mini-col-num">3</span>
          </div>

          <!-- Board Grid (3w x 2h) -->
          <div class="mini-board-grid">
            <div class="mini-board-row">
              <!-- Row 1 (top): Show ghost predictive moves if unlocked -->
              <div class="mini-board-cell" />
              <div
                class="mini-board-cell"
                :class="{ghost: !game.lockPredictions, 'next-ghost': !game.lockPredictions}"
              >
                <span v-if="!game.lockPredictions" class="mini-ghost-step">1</span>
              </div>
              <div class="mini-board-cell" />
            </div>
            <div class="mini-board-row">
              <!-- Row 2 (bottom): Solid checkers -->
              <div class="mini-board-cell p1" />
              <div class="mini-board-cell p2" />
              <div class="mini-board-cell" />
            </div>
          </div>
        </div>

        <!-- Indicators, evaluation, and autoplay buttons -->
        <div class="mini-indicators-area">
          <div class="mini-player-info-row">
            <!-- Player 1 info block -->
            <div class="mini-player-info">
              <span class="p1-text">P1</span>
              <span v-if="!game.hideEvalBar" class="mini-eval-score win">+5</span>
            </div>

            <!-- Status button/indicator (representing predictive moves lock/unlock) -->
            <div
              class="mini-status-label"
              :class="{
                'is-interactive': !game.lockPredictions,
                'is-locked': game.lockPredictions,
              }"
            >
              <svg
                v-if="game.lockPredictions"
                class="mini-lock-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>{{ game.lockPredictions ? 'Locked' : 'P1 wins in 6' }}</span>
            </div>

            <!-- Player 2 info block -->
            <div class="mini-player-info text-right">
              <span v-if="!game.hideEvalBar" class="mini-eval-score loss">-5</span>
              <span class="p2-text">P2</span>
            </div>
          </div>

          <!-- Autoplay controls (hidden if hideAutoplay) -->
          <div v-if="!game.hideAutoplay" class="mini-autoplay-row">
            <div class="mini-auto-btn" />
            <div class="mini-auto-both-btn" />
            <div class="mini-auto-btn" />
          </div>

          <!-- Evaluation Meter Bar (hidden if hideEvalBar) -->
          <div v-if="!game.hideEvalBar" class="mini-meter-block">
            <div class="mini-meter-ticks">
              <div class="tick" />
              <div class="tick centre" />
              <div class="tick" />
            </div>
            <div class="mini-meter-bar" />
          </div>
        </div>
      </div>

      <!-- Sidebar elements reordered -->
      <div class="mini-sidebar">
        <template v-for="item in game.asideOrder" :key="item">
          <!-- Move sequence card -->
          <div
            v-if="item === 'move-sequence'"
            class="mini-card"
            :class="{'is-disabled': game.hideMoveSequence}"
          >
            <span class="mini-card-title">{{ $t('moves.title') }}</span>
            <div class="mini-dots-row">
              <span class="p1-dot" />
              <span class="p2-dot" />
              <span class="p1-dot" />
            </div>
          </div>

          <!-- Game controls card (reset + navigation + replay) -->
          <div
            v-if="item === 'game-controls'"
            class="mini-card"
            :class="{'is-disabled': game.hideNavigation && game.hideReplay}"
          >
            <span class="mini-card-title">{{
              $t('settings.aside.game-controls').split(' ')[0]
            }}</span>
            <div class="mini-controls-content">
              <!-- Always visible reset button -->
              <div class="mini-button reset" />

              <!-- Navigation buttons (Back, Forward) -->
              <div v-if="!game.hideNavigation" class="mini-buttons-row">
                <div class="mini-button" />
                <div class="mini-button" />
              </div>

              <!-- Replay button -->
              <div v-if="!game.hideReplay" class="mini-button replay" />
            </div>
          </div>

          <!-- Export / import card -->
          <div
            v-if="item === 'export-import'"
            class="mini-card"
            :class="{'is-disabled': game.hideExportImport}"
          >
            <span class="mini-card-title"
              >{{ $t('recap.tab_export') }} / {{ $t('recap.tab_import') }}</span
            >
            <div class="mini-tabs-row">
              <div class="mini-tab active" />
              <div class="mini-tab" />
            </div>
          </div>

          <!-- Colors card -->
          <div v-if="item === 'colors'" class="mini-card" :class="{'is-disabled': game.hideColors}">
            <span class="mini-card-title">{{ $t('colors.title') }}</span>
            <div class="mini-swatches-row">
              <div class="mini-swatch p1" />
              <div class="mini-swatch p2" />
            </div>
          </div>

          <!-- Solver status card -->
          <div
            v-if="item === 'solver-status'"
            class="mini-card"
            :class="{'is-disabled': game.hideSolverStatus}"
          >
            <span class="mini-card-title">{{ $t('solver.title') }}</span>
            <div class="mini-solver-status">
              <div class="status-dot" />
              <div class="skeleton-text" />
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Footer block (Skeleton) -->
    <div v-if="!game.hideFooter" class="mini-foot-block">
      <div class="skeleton-footer-line" />
    </div>

    <!-- Language Selector -->
    <div v-if="!game.hideLangSelector" class="mini-lang-selector-wrapper">
      <div class="mini-lang-selector">
        <div class="lang-btn active" />
        <div class="lang-btn" />
        <div class="lang-btn" />
      </div>
    </div>
  </div>
</template>

<script setup>
import {useGameStore} from '@/stores/game';

const game = useGameStore();
</script>

<style scoped>
.mini-app-frame,
.mini-app-frame * {
  box-sizing: border-box;
}

.mini-app-frame {
  container-name: mini-app;
  container-type: inline-size;
  display: flex;
  position: relative;
  flex-direction: column;
  width: 100%;
  padding: 3.5cqw;
  overflow: hidden;
  gap: 3cqw;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-bg);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  color: var(--color-text);
}

/* Skeleton loaders */
.skeleton-title {
  width: 45%;
  height: 3cqw;
  margin: 0 auto 1.5cqw;
  border-radius: 0.6cqw;
  background-color: var(--color-border);
  animation: pulse-skeleton 2s infinite ease-in-out;
}

.skeleton-tagline {
  width: 70%;
  height: 1.8cqw;
  margin: 0 auto;
  border-radius: 0.4cqw;
  background-color: var(--color-surface-alt);
  animation: pulse-skeleton 2s infinite ease-in-out 0.2s;
}

.skeleton-footer-line {
  width: 60%;
  height: 1.8cqw;
  margin: 0 auto;
  border-radius: 0.4cqw;
  background-color: var(--color-surface-alt);
  animation: pulse-skeleton 2s infinite ease-in-out;
}

@keyframes pulse-skeleton {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.8;
  }
}

/* Header & Footer Layout */
.mini-head-block {
  padding-bottom: 2cqw;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  text-align: center;
}

.mini-foot-block {
  padding-top: 2cqw;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  text-align: center;
}

/* Main Structure */
.mini-main-block {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  align-items: start;
  gap: 3cqw;
}

.mini-board-column {
  display: flex;
  flex-direction: column;
  gap: 2cqw;
}

/* Score cell displays */
.mini-score-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5cqw;
}

.mini-score-cell {
  height: 2.5cqw;
  border-radius: 0.6cqw;

  &.win {
    background-color: oklch(0.35 0.12 145);
  }
  &.draw {
    background-color: var(--color-surface-alt);
  }
  &.loss {
    background-color: oklch(0.3 0.1 25);
  }
}

/* Board frame & cells */
.mini-board-wrapper {
  display: flex;
  flex-direction: column;
  padding: 1.8cqw;
  gap: 1.2cqw;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
}

.mini-board-columns-header {
  display: flex;
  justify-content: space-around;
  padding: 0 1cqw;
}

.mini-col-num {
  color: var(--color-text-dim);
  font-weight: 700;
  font-size: 2.2cqw;

  &.suggested {
    color: var(--p1-color);
    text-shadow: 0 0 6px var(--p1-color);
    animation: mini-suggested-pulse 1.2s ease-in-out infinite;
  }
}

@keyframes mini-suggested-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
}

.mini-board-grid {
  display: flex;
  flex-direction: column;
  padding: 1.2cqw;
  gap: 1cqw;
  border-radius: var(--radius-sm);
  background-color: oklch(0.3 0.1 250);
}

.mini-board-row {
  display: flex;
  justify-content: space-around;
  gap: 1cqw;
}

.mini-board-cell {
  width: 5cqw;
  height: 5cqw;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.08);

  &.p1 {
    background-color: var(--p1-color);
    box-shadow: 0 0 8px var(--p1-color);
  }

  &.p2 {
    background-color: var(--p2-color);
    box-shadow: 0 0 8px var(--p2-color);
  }

  &.ghost {
    display: flex;
    position: relative;
    align-items: center;
    justify-content: center;
    border: 1.5px dashed oklch(from var(--p1-color) l c h / 0.5);
    background-color: oklch(from var(--p1-color) l c h / 0.15);
  }

  &.next-ghost {
    border-style: solid;
    border-color: oklch(from var(--p1-color) max(0.6, l) c h / 0.8);
    box-shadow: 0 0 8px oklch(from var(--p1-color) l c h / 0.4);
  }
}

.mini-ghost-step {
  color: oklch(from var(--p1-color) max(0.7, l) c h);
  font-weight: 700;
  font-size: 2cqw;
  font-family: var(--font-mono);
}

/* Indicators block styling */
.mini-indicators-area {
  display: flex;
  flex-direction: column;
  gap: 1.8cqw;
}

.mini-player-info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5cqw;
}

.mini-player-info {
  display: flex;
  align-items: center;
  gap: 1cqw;

  & .p1-text {
    color: oklch(from var(--p1-color) max(0.65, l) c h);
    font-weight: 700;
    font-size: 2.2cqw;
  }
  & .p2-text {
    color: oklch(from var(--p2-color) max(0.65, l) c h);
    font-weight: 700;
    font-size: 2.2cqw;
  }
}

.mini-eval-score {
  padding: 0.2cqw 0.6cqw;
  border-radius: 0.4cqw;
  background-color: var(--color-surface-alt);
  font-weight: 600;
  font-size: 2cqw;
  font-family: var(--font-mono);

  &.win {
    color: oklch(0.75 0.15 145);
  }
  &.loss {
    color: oklch(0.75 0.15 25);
  }
}

.mini-status-label {
  display: flex;
  align-items: center;
  padding: 0.6cqw 1.5cqw;
  gap: 0.8cqw;
  border-radius: 0.6cqw;
  font-weight: 600;
  font-size: 2.2cqw;
  white-space: nowrap;
  transition: all 0.2s;

  &.is-interactive {
    border: 1px dashed var(--color-accent);
    background-color: rgba(255, 255, 255, 0.02);
    color: var(--color-accent);
    cursor: pointer;

    &:hover {
      border-style: solid;
      background-color: rgba(255, 255, 255, 0.05);
    }
  }

  &.is-locked {
    border: 1px solid transparent;
    background-color: transparent;
    color: var(--color-text-dim);
  }
}

.mini-lock-icon {
  width: 2.2cqw;
  height: 2.2cqw;
  color: var(--color-text-dim);
}

/* Autoplay Buttons formatting */
.mini-autoplay-row {
  display: flex;
  justify-content: space-between;
  gap: 1cqw;
}

.mini-auto-btn {
  flex: 1;
  height: 3cqw;
  border: 1px solid var(--color-border);
  border-radius: 0.6cqw;
  background-color: var(--color-surface);
}

.mini-auto-both-btn {
  flex: 1.2;
  height: 3cqw;
  border: 1px dashed var(--color-border);
  border-radius: 0.6cqw;
  background-color: rgba(255, 255, 255, 0.04);
}

/* Ticks and bar for balance evaluation graph */
.mini-meter-block {
  display: flex;
  flex-direction: column;
  gap: 0.8cqw;
}

.mini-meter-ticks {
  display: flex;
  justify-content: space-between;
  padding: 0 0.5cqw;
}

.mini-meter-ticks .tick {
  width: 1px;
  height: 1cqw;
  background-color: var(--color-border);

  &.centre {
    background-color: var(--color-text-dim);
  }
}

.mini-meter-bar {
  height: 1.2cqw;
  border-radius: 0.6cqw;
  background: linear-gradient(90deg, var(--p1-color) 45%, var(--p2-color) 55%);
}

/* Sidebar structure */
.mini-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.8cqw;
}

.mini-card {
  display: flex;
  position: relative;
  flex-direction: column;
  padding: 1.8cqw;
  gap: 1.2cqw;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
  transition:
    opacity 0.2s,
    filter 0.2s;

  &.is-disabled {
    filter: grayscale(0.85);
    opacity: 0.15;
    pointer-events: none;
  }
}

.mini-card-title {
  color: var(--color-text-dim);
  font-weight: 700;
  font-size: 2.2cqw;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

/* Dots inside the move list representation */
.mini-dots-row {
  display: flex;
  gap: 1cqw;
}

.p1-dot {
  width: 2.5cqw;
  height: 2.5cqw;
  border-radius: 50%;
  background-color: var(--p1-color);
  box-shadow: 0 0 4px var(--p1-color);
}

.p2-dot {
  width: 2.5cqw;
  height: 2.5cqw;
  border-radius: 50%;
  background-color: var(--p2-color);
  box-shadow: 0 0 4px var(--p2-color);
}

/* Buttons and content fields inside Game Controls */
.mini-controls-content {
  display: flex;
  flex-direction: column;
  gap: 1.2cqw;
}

.mini-button {
  height: 3cqw;
  border: 1px solid var(--color-border);
  border-radius: 0.6cqw;
  background-color: var(--color-surface-alt);

  &.reset {
    border-color: rgba(238, 102, 119, 0.4);
    background-color: rgba(238, 102, 119, 0.05);
  }

  &.replay {
    border-color: var(--color-accent);
    background-color: rgba(24, 188, 156, 0.05);
  }
}

.mini-buttons-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1cqw;
}

/* Export / Import tabs */
.mini-tabs-row {
  display: flex;
  padding-bottom: 0.5cqw;
  gap: 1cqw;
  border-bottom: 1px solid var(--color-border);
}

.mini-tab {
  width: 35%;
  height: 1.8cqw;
  border-radius: 0.4cqw;
  background-color: var(--color-surface-alt);

  &.active {
    background-color: var(--color-text-dim);
  }
}

/* Colors swatch cards */
.mini-swatches-row {
  display: flex;
  gap: 1.5cqw;
}

.mini-swatch {
  width: 3.5cqw;
  height: 3.5cqw;
  border-radius: 0.6cqw;

  &.p1 {
    background-color: var(--p1-color);
  }
  &.p2 {
    background-color: var(--p2-color);
  }
}

/* WASM solver compiler indicators */
.mini-solver-status {
  display: flex;
  align-items: center;
  gap: 1.2cqw;
}

.status-dot {
  width: 1.8cqw;
  height: 1.8cqw;
  border-radius: 50%;
  background-color: oklch(0.75 0.15 145);
  box-shadow: 0 0 6px oklch(0.75 0.15 145);
}

.mini-solver-status .skeleton-text {
  width: 60%;
  height: 1.8cqw;
  border-radius: 0.4cqw;
  background-color: var(--color-surface-alt);
}

/* Lang picker row */
.mini-lang-selector-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 1cqw;
}

.mini-lang-selector {
  display: flex;
  padding: 0.8cqw;
  gap: 0.8cqw;
  border: 1px solid var(--color-border);
  border-radius: 0.8cqw;
  background-color: var(--color-surface);
}

.lang-btn {
  width: 4cqw;
  height: 2.2cqw;
  border-radius: 0.4cqw;
  background-color: transparent;

  &.active {
    background-color: var(--color-surface-alt);
  }
}

/* Media/Container Query to stack layouts on narrow screens */
@container mini-app (max-width: 280px) {
  .mini-main-block {
    grid-template-columns: 1fr;
    gap: 4cqw;
  }
}
</style>
