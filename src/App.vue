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
  <RouterView />
  <footer class="site-footer" v-if="!game.hideFooter">
    <div>
      {{ $t('footer.solver_by') }}
      <a href="https://github.com/PascalPons/connect4" target="_blank" rel="noopener">Pascal Pons</a
      >. {{ $t('footer.inspired_by') }}
      <a href="https://2swap.github.io/WeakC4/" target="_blank" rel="noopener">2swap's WeakC4</a>.
    </div>
    <div>
      <a href="https://github.com/Khoding/connect4-solver" target="_blank" rel="noopener">{{
        $t('footer.github_repo')
      }}</a>
    </div>
    <div>
      {{ $t('footer.licensed_under') }}
      <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener"
        >AGPL-3.0</a
      >
    </div>
  </footer>
  <div class="lang-selector-wrapper" v-if="!game.hideLangSelector">
    <div class="lang-selector">
      <button
        v-for="l in ['en', 'fr', 'de']"
        :key="l"
        :class="{active: locale === l}"
        @click="changeLocale(l)"
        :aria-label="`Switch language to ${l.toUpperCase()}`"
      >
        {{ l.toUpperCase() }}
      </button>
    </div>
  </div>
</template>

<script setup>
import {onMounted, onUnmounted, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {useGameStore} from '@/stores/game';

const game = useGameStore();
const {locale} = useI18n();

function changeLocale(l) {
  locale.value = l;
  try {
    localStorage.setItem('c4_locale', l);
  } catch {
    /* localStorage unavailable */
  }
}

/*
 * Resolve --cell-size in JS rather than relying on a live `vmin` unit.
 *
 * On Android Chrome, after an in-place reload of the installed PWA, viewport
 * units are re-resolved lazily per element as it repaints. Cells that get
 * repainted (e.g. when the solver/ghost path gives them an inline style) pick
 * up the post-reload viewport and shrink, while untouched cells keep their
 * original size — so the board ends up with mismatched circles. Setting a
 * concrete px value on the root makes every cell inherit the same number and
 * recompute together whenever it changes, so they can never disagree.
 *
 * Mirrors the CSS fallback: clamp(40px, 10vmin, 104px), then shrinks further
 * if needed so the active board (which can be up to 10 columns wide) fits the
 * viewport width without forcing horizontal scroll.
 */
function updateCellSize() {
  const vmin = Math.min(window.innerWidth, window.innerHeight);
  let size = Math.min(104, Math.max(40, vmin * 0.1));

  // Fit the whole board across the viewport. Reserve room for the row-label
  // column, board padding, page gutters, and the inter-cell gap.
  const cols = game.COLS;
  const gap = 6; // matches --board-gap
  const reserve = 64; // row labels + board padding + page gutters
  const maxByWidth = (window.innerWidth - reserve) / cols - gap;
  size = Math.min(size, maxByWidth);

  // Keep cells tappable even on the widest board / narrowest viewport;
  // .board-grid has overflow-x: auto as the ultimate fallback.
  size = Math.max(28, size);

  document.documentElement.style.setProperty('--cell-size', `${size}px`);
}

onMounted(() => {
  updateCellSize();
  window.addEventListener('resize', updateCellSize);
  window.addEventListener('orientationchange', updateCellSize);
});

// Recompute when the board size preset changes (column count affects fit).
watch(() => game.COLS, updateCellSize);

onUnmounted(() => {
  window.removeEventListener('resize', updateCellSize);
  window.removeEventListener('orientationchange', updateCellSize);
});
</script>

<style>
.site-footer {
  padding: 0.75rem 0;
  color: var(--color-text-dim);
  font-size: 0.8rem;
  text-align: center;
}

.lang-selector-wrapper {
  display: flex;
  justify-content: center;
}

.lang-selector {
  display: inline-flex;
  margin-block-start: 0.75rem;
  padding: 3px;
  gap: 0.25rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  backdrop-filter: blur(8px);
  background-color: var(--color-surface);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.lang-selector button {
  padding: 4px 8px;
  border: none;
  border-radius: calc(var(--radius-sm) - 2px);
  background: transparent;
  color: var(--color-text-dim);
  font-weight: 600;
  font-size: 0.75rem;
  cursor: pointer;
  transition:
    background-color 0.15s,
    color 0.15s;
}

.lang-selector button:hover {
  color: var(--color-text);
}

.lang-selector button.active {
  background-color: var(--color-surface-alt);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
  color: var(--color-accent);
}
</style>
