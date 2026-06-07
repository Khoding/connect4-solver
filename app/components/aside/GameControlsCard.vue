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
  <section
    v-show="!game.hideReplay"
    class="controls-card-wrapper"
    :aria-label="$t('controls.replay_aria')"
  >
    <!-- Replay controls -->
    <div class="controls replay-controls">
      <BaseButton
        :title="$t('controls.replay_title')"
        :aria-label="$t('controls.replay_aria')"
        :disabled="!game.gameOver && !game.replayActive"
        :variant="game.replayActive ? 'replay-active' : 'replay'"
        :aria-pressed="game.replayActive"
        @click="game.replayActive ? game.stopReplay() : game.startReplay()"
      >
        <template #icon>
          <svg
            v-if="game.replayActive"
            xmlns="http://www.w3.org/2000/svg"
            width="1.2em"
            height="1.2em"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            width="1.2em"
            height="1.2em"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polygon points="10 8 16 12 10 16 10 8" />
          </svg>
        </template>
        {{ game.replayActive ? $t('controls.stop') : $t('controls.replay') }}
      </BaseButton>
      <BaseButton
        v-if="!game.replayActive"
        :title="$t('controls.continue_title')"
        :aria-label="$t('controls.continue_aria')"
        :disabled="!game.isReviewingHistory || !game.gameOver"
        @click="game.continueReplay()"
      >
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
            aria-hidden="true"
          >
            <polygon points="6 3 20 12 6 21 6 3" />
          </svg>
        </template>
        {{ $t('controls.continue') }}
      </BaseButton>
    </div>
  </section>
</template>

<script setup>
import BaseButton from '@/components/BaseButton.vue';
import {useGameStore} from '@/stores/game';

const game = useGameStore();
</script>

<style scoped>
.controls-card-wrapper {
  display: flex;
  flex-direction: column;
  gap: clamp(0.5rem, 1.5vh, 1rem);
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;

  & :deep(.base-button-wrapper) {
    flex: 1;
  }

  @container info-panel (max-width: 350px) {
    & {
      flex-direction: column;
    }
  }
}
</style>
