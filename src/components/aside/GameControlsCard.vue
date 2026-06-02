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
  <div class="controls-card-wrapper">
    <!-- Board controls -->
    <div class="controls">
      <button
        v-if="!game.resetPending"
        class="reset-btn"
        title="Reset board (R)"
        aria-label="Reset board"
        :disabled="game.totalMoves === 0"
        @click="game.resetBoard()"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="1.2em"
          viewBox="0 -960 960 960"
          width="1.2em"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            d="M339.5-108.5q-65.5-28.5-114-77t-77-114Q120-365 120-440h80q0 117 81.5 198.5T480-160q117 0 198.5-81.5T760-440q0-117-81.5-198.5T480-720h-6l62 62-56 58-160-160 160-160 56 58-62 62h6q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-440q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-80q-75 0-140.5-28.5Z"
          />
        </svg>
        Reset (R)
      </button>
      <template v-else>
        <button class="confirm-btn" aria-label="Confirm reset board" @click="game.resetBoard()">
          Confirm reset
        </button>
        <button aria-label="Cancel reset board" @click="game.cancelReset()">Cancel</button>
      </template>

      <RouterLink to="/settings" class="settings-btn" title="Settings" aria-label="Open settings">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="1.2em"
          viewBox="0 -960 960 960"
          width="1.2em"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            d="m370-80-16-128q-19-5-38.5-15.5T279-247l-121 51-85-147 101-77q-2-10-2-19.5t2-19.5L73-538l85-147 121 51q16-14 35.5-24.5T353-674l17-126h170l17 127q19 5 38.5 15.5T629-633l121-51 85 147-101 77q2 10 2 19.5t-2 19.5l101 77-85 147-121-51q-16 14-35.5 24.5T547-206l-17 126H370Zm110-280q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35Z"
          />
        </svg>
        Settings
      </RouterLink>
    </div>

    <!-- Navigation controls -->
    <div v-if="!game.hideNavigation" class="controls">
      <button
        title="Step back"
        aria-label="Step back in history"
        :disabled="!game.canStepBack"
        @click="game.stepBack()"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="1.2em"
          viewBox="0 -960 960 960"
          width="1.2em"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M640-200 200-480l440-280v560Zm-80-280Zm0 134v-268L350-480l210 134Z" />
        </svg>
        Back
      </button>
      <button
        title="Step forward"
        aria-label="Step forward in history"
        :disabled="!game.canStepForward"
        @click="game.stepForward()"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="1.2em"
          viewBox="0 -960 960 960"
          width="1.2em"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z" />
        </svg>
        Forward
      </button>
      <button
        title="Jump to latest move"
        aria-label="Jump to latest move"
        :disabled="!game.isReviewingHistory"
        @click="game.goToLatest()"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="1.2em"
          viewBox="0 -960 960 960"
          width="1.2em"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            d="M660-240v-480h80v480h-80Zm-440 0v-480l320 240-320 240Zm80-240Zm0 114 152-114-152-114v228Z"
          />
        </svg>
        Latest
      </button>
    </div>

    <!-- Replay controls -->
    <div v-if="!game.hideReplay" class="controls">
      <button
        class="replay-btn"
        title="Replay the game from the start"
        aria-label="Replay game from start"
        :disabled="!game.gameOver && !game.replayActive"
        :class="{active: game.replayActive}"
        :aria-pressed="game.replayActive"
        @click="game.replayActive ? game.stopReplay() : game.startReplay()"
      >
        <svg
          v-if="game.replayActive"
          xmlns="http://www.w3.org/2000/svg"
          height="1.2em"
          viewBox="0 -960 960 960"
          width="1.2em"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M320-320v-320h320v320H320Z" />
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          height="1.2em"
          viewBox="0 -960 960 960"
          width="1.2em"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            d="M380-300l280-180-280-180v360Zm100 220q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"
          />
        </svg>
        {{ game.replayActive ? 'Stop' : 'Replay' }}
      </button>
      <button
        v-if="!game.replayActive"
        title="Continue replay from current position"
        aria-label="Continue replay from current position"
        :disabled="!game.isReviewingHistory || !game.gameOver"
        @click="game.continueReplay()"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="1.2em"
          viewBox="0 -960 960 960"
          width="1.2em"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z" />
        </svg>
        Continue
      </button>
    </div>
  </div>
</template>

<script setup>
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

  & button,
  & .settings-btn {
    display: inline-flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    padding: 8px 12px;
    gap: 0.3rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background-color: var(--color-surface);
    color: var(--color-text);
    font-size: 0.9rem;
    text-decoration: none;
    cursor: pointer;
    transition:
      background-color 0.15s,
      border-color 0.15s,
      color 0.15s;

    &:hover:not(:disabled) {
      background-color: var(--color-surface-alt);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.3;
    }

    &.reset-btn {
      border-color: color-mix(in oklch, var(--color-border), oklch(0.65 0.2 25) 30%);
      color: oklch(0.65 0.2 25);

      &:hover:not(:disabled) {
        border-color: oklch(0.65 0.2 25);
        background-color: oklch(0.65 0.2 25 / 0.1);
        color: oklch(0.7 0.22 25);
      }
    }

    &.replay-btn {
      border-color: color-mix(in oklch, var(--color-border), var(--color-accent) 30%);
      color: var(--color-accent);

      &:hover:not(:disabled) {
        border-color: var(--color-accent);
        background-color: color-mix(in oklch, var(--color-accent), transparent 90%);
      }

      &.active {
        border-color: var(--color-accent);
        background-color: var(--color-accent);
        color: var(--color-bg);

        &:hover {
          background-color: color-mix(in oklch, var(--color-accent), black 15%);
        }
      }
    }

    &.confirm-btn {
      border-color: oklch(0.6 0.22 25);
      background-color: oklch(0.45 0.2 25);
      color: white;

      &:hover {
        background-color: oklch(0.5 0.22 25);
      }
    }
  }

  @container info-panel (max-width: 350px) {
    & {
      flex-direction: column;
    }
  }
}
</style>
