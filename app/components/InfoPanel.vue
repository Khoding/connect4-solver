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
  <aside class="info-panel">
    <template v-for="item in game.asideOrder" :key="item">
      <LearnCard v-if="item === 'learn' && !game.hideLearn" />
      <SteadyStateCard v-if="item === 'steady-state' && game.steadyCardVisible" />
      <MoveSequenceCard v-if="item === 'move-sequence'" />
      <GameControlsCard v-if="item === 'game-controls'" />
      <ExportRecap v-if="item === 'export-import' && !game.hideExportImport" />
      <ColorPresetsCard v-if="item === 'colors'" />
      <SolverStatusCard v-if="item === 'solver-status'" />
    </template>
  </aside>
</template>

<script setup>
import {useGameStore} from '@/stores/game';
import LearnCard from './aside/LearnCard.vue';
import SteadyStateCard from './aside/SteadyStateCard.vue';
import MoveSequenceCard from './aside/MoveSequenceCard.vue';
import GameControlsCard from './aside/GameControlsCard.vue';
import ExportRecap from './ExportRecap.vue';
import ColorPresetsCard from './aside/ColorPresetsCard.vue';
import SolverStatusCard from './aside/SolverStatusCard.vue';

const game = useGameStore();
</script>

<style scoped>
.info-panel {
  container-name: info-panel;
  container-type: inline-size;

  display: flex;
  flex: 1;
  flex-direction: column;
  max-inline-size: 380px;
  gap: clamp(0.5rem, 1.5vh, 1rem);
}

@media (max-width: 720px) {
  .info-panel {
    inline-size: 100%;
    max-inline-size: 100%;
  }
}

@media (min-width: 721px) and (max-width: 1100px) {
  .info-panel {
    min-inline-size: 260px;
  }
}
</style>
