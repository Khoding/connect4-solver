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
  <div class="board-area">
    <div class="board-grid">
      <div class="column-buttons">
        <div
          v-for="(s, i) in game.solverScores ?? Array(7).fill(-1000)"
          :key="i"
          class="score-cell"
          :class="scoreClass(s)"
        >
          {{ s === -1000 ? '—' : s > 0 ? `+${s}` : s }}
        </div>

        <div
          v-for="c in game.COLS"
          :key="c"
          class="col-header"
          :class="{
            suggested: isSuggested(c),
            disabled: game.boardArr[game.ROWS - 1][c - 1] !== 0 || !!game.winLine,
          }"
          :style="
            isSuggested(c)
              ? {
                  '--player-color': game.displayColorOf(game.internalCurrentPlayer),
                }
              : {}
          "
        >
          {{ c }}
        </div>
      </div>

      <div class="row-labels">
        <div v-for="vr in game.ROWS" :key="vr" class="row-label">{{ game.ROWS - vr + 1 }}</div>
      </div>

      <div class="board">
        <template v-for="vr in game.ROWS" :key="vr">
          <div
            v-for="c in game.COLS"
            :key="`${vr}-${c}`"
            class="cell"
            :style="cellStyle(game.ROWS - vr, c - 1)"
            :class="{
              winning: isWinningCell(game.ROWS - vr, c - 1),
              'last-move': isLastMove(game.ROWS - vr, c - 1),
            }"
            @click="game.makeMove(c)"
          ></div>
        </template>
      </div>

      <div class="player-indicators">
        <div class="player-info-row">
          <div class="player-info">
            <span :style="{color: `oklch(from ${game.color1} max(0.65, l) c h)`}">P1</span>
            <span class="eval-score" :class="evalClass(game.positionEval?.first)">
              {{ formatEval(game.positionEval?.first) }}
            </span>
          </div>

          <div
            v-if="game.winLine"
            class="winner-label"
            :style="{
              color: `oklch(from ${game.internalCurrentPlayer === 2 ? game.color1 : game.color2} max(0.65, l) c h)`,
            }"
          >
            P{{ game.internalCurrentPlayer === 2 ? 1 : 2 }} Winner
          </div>

          <div class="player-info">
            <span class="eval-score" :class="evalClass(game.positionEval?.second)">
              {{ formatEval(game.positionEval?.second) }}
            </span>
            <span :style="{color: `oklch(from ${game.color2} max(0.65, l) c h)`}">P2</span>
          </div>
        </div>

        <meter
          class="eval-meter"
          :min="0"
          :max="100"
          :optimum="50"
          :value="(((game.positionEval?.first ?? 0) + 18) / 36) * 100"
        ></meter>
      </div>
    </div>
  </div>
</template>

<script setup>
import {useGameStore} from '@/stores/game';

const game = useGameStore();

function isSuggested(col) {
  if (!game.repstr.length) return col === 4;
  return (
    game.suggestion?.bestCols?.includes(col) &&
    game.boardArr[game.ROWS - 1][col - 1] === 0 &&
    !game.winLine
  );
}

function cellStyle(row, col) {
  const p = game.boardArr[row][col];
  if (p === 0) return {};
  const color = game.displayColorOf(p);
  return {
    backgroundColor: color,
    boxShadow: `0 0 12px ${color}40`,
    '--glow': color,
  };
}

function isWinningCell(row, col) {
  return game.winLine?.some(([wy, wx]) => wy === row && wx === col) ?? false;
}

function isLastMove(row, col) {
  const pos = game.repstr;
  if (!pos.length) return false;
  const lastCol = pos.charCodeAt(pos.length - 1) - 49;
  if (col !== lastCol) return false;
  // find the topmost filled row in that column
  for (let y = game.ROWS - 1; y >= 0; y--) {
    if (game.boardArr[y][lastCol] !== 0) return y === row;
  }
  return false;
}

function scoreClass(score) {
  if (score === -1000) return 'disabled';
  if (score > 0) return 'score-win';
  if (score === 0) return 'score-draw';
  return 'score-loss';
}

function evalClass(score) {
  score = score ?? 0;
  if (score > 0) return 'eval-win';
  if (score === 0) return 'eval-draw';
  return 'eval-loss';
}

function formatEval(score) {
  score = score ?? 0;
  if (score > 0) return `+${score} (wins)`;
  if (score === 0) return '0 (draw)';
  return `${score} (loses)`;
}
</script>

<style scoped>
.board-area {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  align-items: center;
  max-inline-size: 100%;
}

.board-grid {
  display: grid;
  grid-template-rows: auto max-content;
  grid-template-columns: max-content max-content;
  max-inline-size: 100%;
  margin-inline: auto;
  padding-bottom: 0.5rem;
  overflow-x: auto;
  gap: var(--board-gap);
}

.column-buttons {
  display: grid;
  grid-template-columns: repeat(7, var(--cell-size));
  grid-column: 2;
  padding-inline: var(--board-gap);
  gap: var(--board-gap);
  font-size: 0.85rem;
}

.row-labels {
  display: grid;
  grid-template-rows: repeat(6, var(--cell-size));
  grid-row: 2;
  grid-column: 1;
  align-items: center;
  padding-inline-end: 6px;
  padding-block: var(--board-gap);
  gap: var(--board-gap);
}

.board {
  display: grid;
  grid-template-rows: repeat(6, var(--cell-size));
  grid-template-columns: repeat(7, var(--cell-size));
  grid-row: 2;
  grid-column: 2;
  padding: var(--board-gap);
  gap: var(--board-gap);
  border-radius: calc(var(--board-gap) + var(--cell-size) / 2);
  background-color: oklch(0.3 0.1 250);
}

.player-indicators {
  display: flex;
  grid-column: 2;
  flex-direction: column;
  inline-size: 100%;
  gap: 0.5rem;
  font-size: small;
}

.player-info-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  inline-size: 100%;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.player-info:last-child {
  grid-column: 3;
  justify-content: flex-end;
}

.winner-label {
  grid-column: 2;
  font-weight: 700;
  text-align: center;
  text-transform: uppercase;
}

.col-header {
  padding: 4px 2px;
  border-radius: var(--radius-sm);
  background-color: var(--color-surface-alt);
  color: var(--color-text-dim);
  font-weight: 600;
  text-align: center;

  &.disabled {
    opacity: 0.3;
  }

  &.suggested {
    background-color: var(--player-color);
    color: oklch(from var(--player-color) clamp(0.15, (0.5 - l) * 10000, 0.95) c h);
    animation: pulse 1.2s ease-in-out infinite;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.row-label {
  display: grid;
  place-items: center;
  block-size: var(--cell-size);
  color: var(--color-text-dim);
  font-weight: 600;
  font-size: 0.8rem;
  user-select: none;
}

.cell {
  inline-size: var(--cell-size);
  block-size: var(--cell-size);
  border-radius: 50%;
  background-color: var(--color-empty);
  cursor: pointer;
  transition:
    background-color 0.2s,
    box-shadow 0.2s;

  &.winning {
    animation: win-glow 0.6s ease-in-out infinite alternate;
  }

  &.last-move {
    position: relative;

    &::after {
      position: absolute;
      inline-size: 15%;
      block-size: 15%;
      inset: 50%;
      translate: -50% -50%;
      border-radius: 50%;
      /* Flips by 0.5 depending on lightness, but clamped to avoid pure black or pure white */
      background-color: oklch(
        from var(--glow) max(0.2, min(0.9, l + clamp(-0.5, (0.5 - l) * 10000, 0.5))) c h
      );
      content: '';
    }
  }
}

@keyframes win-glow {
  from {
    box-shadow: 0 0 8px var(--glow);
  }
  to {
    box-shadow:
      0 0 24px var(--glow),
      0 0 40px var(--glow);
  }
}

@media (max-width: 720px) {
  .board-area {
    align-items: stretch;
    max-inline-size: 100%;
  }
}

.score-cell {
  padding: 4px 2px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  text-align: center;

  &.score-win {
    background-color: oklch(0.35 0.12 145);
    color: oklch(0.8 0.15 145);
  }

  &.score-draw {
    background-color: var(--color-surface-alt);
    color: var(--color-text-dim);
  }

  &.score-loss {
    background-color: oklch(0.3 0.1 25);
    color: oklch(0.75 0.15 25);
  }

  &.disabled {
    background-color: var(--color-surface-alt);
    color: var(--color-text-dim);
    opacity: 0.3;
  }
}

.eval-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
}

.eval-label {
  font-weight: 600;
  font-size: 0.9rem;
}

.eval-score {
  font-weight: 600;
  font-size: 0.85rem;
  font-family: var(--font-mono);

  &.eval-win {
    color: oklch(0.75 0.15 145);
  }

  &.eval-draw {
    color: var(--color-text-dim);
  }

  &.eval-loss {
    color: oklch(0.75 0.15 25);
  }
}

.eval-meter {
  inline-size: 100%;

  &::-webkit-meter-optimum-value {
    background-color: var(--color-win);
  }
  &::-moz-meter-bar {
    background-color: var(--color-win);
  }
}
</style>
