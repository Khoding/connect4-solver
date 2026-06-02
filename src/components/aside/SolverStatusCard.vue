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
  <section v-if="!game.hideSolverStatus" class="info-card" aria-labelledby="solver-heading">
    <h2 id="solver-heading" class="card-heading">Solver</h2>
    <div class="status-content" aria-live="polite">
      <p class="dim">{{ game.solverStatusText }}</p>
      <p v-if="game.solverError" class="dim error-text">Solver error: {{ game.solverError }}</p>
    </div>
  </section>
</template>

<script setup>
import {useGameStore} from '@/stores/game';

const game = useGameStore();
</script>

<style scoped>
.info-card {
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
}

.dim {
  margin: 0;
  color: var(--color-text-dim);
  font-size: 0.8rem;
}

.error-text {
  margin-block-start: 0.5rem;
  color: oklch(0.7 0.18 25);
}
</style>
