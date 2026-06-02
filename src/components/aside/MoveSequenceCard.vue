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
  <section v-if="!game.hideMoveSequence" class="info-card" aria-labelledby="move-seq-heading">
    <h2 id="move-seq-heading" class="card-heading">Move sequence</h2>
    <div class="mono-wrapper">
      <template v-if="!game.moveHistory.length">
        <p class="dim text-start">(start)</p>
      </template>
      <template v-else>
        <ol class="move-list" aria-label="Moves played">
          <li
            v-for="(move, i) in game.moveHistory"
            :key="i"
            class="move-item"
            :class="{
              'is-optimal': i < game.viewCursor && game.moveOptimality[i] === true,
              'is-suboptimal': i < game.viewCursor && game.moveOptimality[i] === false,
              'is-future': i >= game.viewCursor,
            }"
            :title="
              i >= game.viewCursor
                ? 'Future move'
                : game.moveOptimality[i] === true
                  ? 'Optimal move'
                  : game.moveOptimality[i] === false
                    ? 'Suboptimal move'
                    : 'Unknown'
            "
            :aria-label="getMoveAriaLabel(move, i)"
          >
            <span class="move-num" aria-hidden="true">{{ i + 1 }}</span>
            <span
              class="move-col"
              aria-hidden="true"
              :style="{
                color: `oklch(from ${i % 2 === 0 ? game.color1 : game.color2} max(0.65, l) c h)`,
              }"
              >{{ move }}</span
            >
            <span class="move-score" aria-hidden="true" :class="scoreClass(game.moveScores[i])">{{
              formatMoveScore(game.moveScores[i])
            }}</span>
          </li>
        </ol>
      </template>
    </div>
    <p class="dim" aria-live="polite">Move {{ game.viewCursor }} / {{ game.totalMoves }}</p>
  </section>
</template>

<script setup>
import {useGameStore} from '@/stores/game';

const game = useGameStore();

function formatMoveScore(score) {
  if (score == null) return '?';
  if (score > 0) return `+${score}`;
  return `${score}`;
}

function scoreClass(score) {
  if (score == null) return 'score-unknown';
  if (score > 0) return 'score-win';
  if (score < 0) return 'score-loss';
  return 'score-draw';
}

function getMoveAriaLabel(move, i) {
  const player = i % 2 === 0 ? 'Player 1' : 'Player 2';
  const optimality =
    i >= game.viewCursor
      ? 'Future move'
      : game.moveOptimality[i] === true
        ? 'Optimal move'
        : game.moveOptimality[i] === false
          ? 'Suboptimal move'
          : 'Unknown optimality';
  const score = game.moveScores[i];
  const scoreText = score != null ? `score ${score > 0 ? '+' : ''}${score}` : 'no score';
  return `Move ${i + 1}: ${player} played column ${move}, ${optimality}, ${scoreText}`;
}
</script>

<style scoped>
.info-card {
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
}

.mono-wrapper {
  margin-block-end: 0.5rem;
  font-family: var(--font-mono);
}

.text-start {
  margin: 0;
}

.move-list {
  display: flex;
  flex-wrap: wrap;
  margin: 0;
  padding: 0;
  gap: 4px;
  list-style: none;
}

.move-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-inline-size: 2rem;
  padding: 3px 6px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
  transition: opacity 0.15s;

  &.is-optimal {
    border-color: oklch(0.75 0.15 150);
  }

  &.is-suboptimal {
    border-color: oklch(0.65 0.2 25);
  }

  &.is-future {
    opacity: 0.35;
  }
}

.move-num {
  color: var(--color-text-dim);
  font-size: 0.6rem;
  line-height: 1.2;
}

.move-col {
  font-size: 0.95rem;
  line-height: 1.2;
}

.move-score {
  font-size: 0.65rem;
  line-height: 1.2;

  &.score-win {
    color: oklch(0.75 0.15 150);
  }

  &.score-loss {
    color: oklch(0.65 0.2 25);
  }

  &.score-draw,
  &.score-unknown {
    color: var(--color-text-dim);
  }
}

.dim {
  margin: 0;
  color: var(--color-text-dim);
  font-size: 0.8rem;
}
</style>
