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
  <header class="header">
    <h1>Connect 4 <span class="subtitle">Solver</span></h1>
    <p class="tagline">Pick your color, then follow the solver's suggestions.</p>
  </header>

  <main class="main">
    <BoardArea />
    <InfoPanel />
  </main>

  <LoadingOverlay />
</template>

<script setup>
import {onMounted, onUnmounted} from 'vue';
import {useGameStore} from '@/stores/game';
import BoardArea from '@/components/BoardArea.vue';
import InfoPanel from '@/components/InfoPanel.vue';
import LoadingOverlay from '@/components/LoadingOverlay.vue';

const game = useGameStore();

onMounted(() => {
  game.init();
  window.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
});

function onKeydown(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  const key = e.key.toLowerCase();
  if (key === 'arrowleft' || key === 'u') game.stepBack();
  if (key === 'arrowright') game.stepForward();
  if (key === 'r') game.resetBoard();
  if (key >= '1' && key <= '7') game.makeMove(parseInt(key));
}
</script>

<style scoped>
.header {
  margin-block-end: clamp(1rem, 3vh, 2rem);
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

.main {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: center;
  gap: clamp(1rem, min(2vw, 2vh), 2.5rem);
}

@media (max-width: 720px) {
  .main {
    flex-direction: column;
    align-items: stretch;
    gap: clamp(1rem, min(2vw, 2vh), 2.5rem);
  }
}

@media (min-width: 721px) and (max-width: 1100px) {
  .main {
    justify-content: center;
  }
}
</style>
