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
      Solver by
      <a href="https://github.com/PascalPons/connect4" target="_blank" rel="noopener">Pascal Pons</a
      >. Inspired by
      <a href="https://2swap.github.io/WeakC4/" target="_blank" rel="noopener">2swap's WeakC4</a>.
    </div>
    <div>
      <a href="https://github.com/Khoding/connect4-solver" target="_blank" rel="noopener"
        >GitHub Repository</a
      >
    </div>
    <div>
      Licensed under
      <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener"
        >AGPL-3.0</a
      >
    </div>
  </footer>
</template>

<script setup>
import {onMounted, onUnmounted} from 'vue';
import {useGameStore} from '@/stores/game';
const game = useGameStore();

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
 * Mirrors the CSS fallback: clamp(40px, 10vmin, 104px).
 */
function updateCellSize() {
  const vmin = Math.min(window.innerWidth, window.innerHeight);
  const size = Math.min(104, Math.max(40, vmin * 0.1));
  document.documentElement.style.setProperty('--cell-size', `${size}px`);
}

onMounted(() => {
  updateCellSize();
  window.addEventListener('resize', updateCellSize);
  window.addEventListener('orientationchange', updateCellSize);
});

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
</style>
