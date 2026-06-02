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
  <section class="controls-card-wrapper" :aria-label="$t('controls.replay_aria')">
    <!-- Board controls -->
    <div class="controls">
      <BaseButton
        v-if="!game.resetPending"
        variant="reset"
        :title="$t('controls.reset_title')"
        :aria-label="$t('controls.reset_aria')"
        :disabled="game.totalMoves === 0"
        @click="game.resetBoard()"
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
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </template>
        {{ $t('controls.reset') }}
      </BaseButton>
      <template v-else>
        <BaseButton
          variant="confirm"
          :aria-label="$t('controls.confirm_reset_aria')"
          @click="game.resetBoard()"
        >
          {{ $t('controls.confirm_reset') }}
        </BaseButton>
        <BaseButton :aria-label="$t('controls.cancel_reset_aria')" @click="game.cancelReset()">
          {{ $t('controls.cancel') }}
        </BaseButton>
      </template>

      <BaseButton
        to="/settings"
        :title="$t('controls.settings_title')"
        :aria-label="$t('controls.settings_aria')"
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
            <path
              d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
            />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </template>
        {{ $t('controls.settings') }}
      </BaseButton>
    </div>

    <!-- Navigation controls -->
    <div v-if="!game.hideNavigation" class="controls">
      <BaseButton
        :title="$t('controls.back_title')"
        :aria-label="$t('controls.back_aria')"
        :disabled="!game.canStepBack"
        @click="game.stepBack()"
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
            <path d="m15 18-6-6 6-6" />
          </svg>
        </template>
        {{ $t('controls.back') }}
      </BaseButton>
      <BaseButton
        :title="$t('controls.forward_title')"
        :aria-label="$t('controls.forward_aria')"
        :disabled="!game.canStepForward"
        @click="game.stepForward()"
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
            <path d="m9 18 6-6-6-6" />
          </svg>
        </template>
        {{ $t('controls.forward') }}
      </BaseButton>
      <BaseButton
        :title="$t('controls.latest_title')"
        :aria-label="$t('controls.latest_aria')"
        :disabled="!game.isReviewingHistory"
        @click="game.goToLatest()"
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
            <polygon points="5 4 15 12 5 20 5 4" />
            <line x1="19" x2="19" y1="5" y2="19" />
          </svg>
        </template>
        {{ $t('controls.latest') }}
      </BaseButton>
    </div>

    <!-- Replay controls -->
    <div v-if="!game.hideReplay" class="controls">
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
