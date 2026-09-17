<!--
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

<!--
  The answer board for practice mode (/practice).

  Deliberately not BoardArea: there is no game here, no history, no autoplay and
  no store-driven position — one click is the whole interaction. Each column is
  a single button, so dropping a disc works by pointer and by keyboard without
  any extra plumbing.

  The glyph and ring vocabulary is the Learn-mode one (see BoardArea's
  GLYPH_CHARS and app/learn/classifier.js), so a marker means the same thing
  here as on the main board.
-->

<template>
  <div class="drill-board" :class="{answered: disabled}">
    <button
      v-for="c in COLS"
      :key="c"
      type="button"
      class="column"
      :class="{full: full(c - 1), chosen: chosenCol === c, solution: solutionCols.includes(c)}"
      :disabled="disabled || full(c - 1)"
      :aria-label="columnLabel(c)"
      @click="$emit('select', c)"
    >
      <span
        v-for="r in ROWS"
        :key="r"
        class="cell"
        :class="[
          lineKind(r - 1, c - 1) ? `line-${lineKind(r - 1, c - 1)}` : '',
          {drop: dropRow(c - 1) === r - 1 && !disabled},
        ]"
      >
        <span
          v-if="board[r - 1][c - 1]"
          class="disc"
          :style="{backgroundColor: discColor(board[r - 1][c - 1])}"
        />
        <span
          v-else-if="glyphAt(r - 1, c - 1)"
          class="glyph"
          :class="`g-${glyphAt(r - 1, c - 1).kind}`"
          :style="glyphAt(r - 1, c - 1).color ? {color: glyphAt(r - 1, c - 1).color} : null"
          aria-hidden="true"
          >{{ glyphAt(r - 1, c - 1).char }}</span
        >
      </span>
      <span class="col-number" aria-hidden="true">{{ c }}</span>
    </button>
  </div>
</template>

<script setup>
import {computed} from 'vue';
import {useI18n} from 'vue-i18n';
import {useGameStore} from '@/stores/game';
import {ROWS, COLS, landingRow} from '@/learn/threats';

const props = defineProps({
  /** board[row][col], row 0 at the bottom, 0 empty / 1 first mover / 2 second. */
  board: {type: Array, required: true},
  /** Marker cells: {row, col, kind, char?, color?}. */
  cells: {type: Array, default: () => []},
  /** Threat lines to outline: {kind, cells: [[row, col], …]}. */
  lines: {type: Array, default: () => []},
  /** The column the learner picked, highlighted while the feedback is up. */
  chosenCol: {type: Number, default: null},
  /** The solver's best column(s), ringed once the answer is in. */
  solutionCols: {type: Array, default: () => []},
  disabled: {type: Boolean, default: false},
});

defineEmits(['select']);

const {t} = useI18n();
const game = useGameStore();

// Mirrors BoardArea's vocabulary so a glyph reads the same on both boards.
const GLYPH_CHARS = {
  win: '✦',
  block: '✦',
  play: '◎',
  opportunity: '○',
  danger: '✕',
  controlled: '◌',
};

const glyphMap = computed(() => {
  const map = {};
  for (const cell of props.cells) {
    map[`${cell.row}-${cell.col}`] = {
      kind: cell.kind,
      char: cell.char ?? GLYPH_CHARS[cell.kind] ?? '•',
      color: cell.color ?? null,
    };
  }
  return map;
});

// Danger wins ties, as on the main board: a square on both sides' lines is the
// one the learner most needs to notice.
const lineMap = computed(() => {
  const map = {};
  for (const line of props.lines) {
    for (const [r, c] of line.cells) {
      const key = `${r}-${c}`;
      if (line.kind === 'danger' || !map[key]) map[key] = line.kind;
    }
  }
  return map;
});

function glyphAt(row, col) {
  return glyphMap.value[`${row}-${col}`] ?? null;
}

function lineKind(row, col) {
  return lineMap.value[`${row}-${col}`] ?? null;
}

function dropRow(col) {
  return landingRow(props.board, col);
}

function full(col) {
  return landingRow(props.board, col) === -1;
}

function discColor(player) {
  return player === 1 ? game.color1 : game.color2;
}

function columnLabel(col) {
  return full(col - 1) ? t('drill.column_full', {col}) : t('drill.column_play', {col});
}
</script>

<style scoped>
.drill-board {
  container-type: inline-size;

  display: flex;
  padding: var(--board-gap);
  gap: var(--board-gap);
  border-radius: var(--radius-md);
  background-color: var(--color-surface-alt);
}

.column {
  display: flex;
  flex: 1;
  flex-direction: column-reverse;
  padding: 0;
  gap: var(--board-gap);
  border: none;
  border-radius: var(--radius-sm);
  background: none;
  cursor: pointer;
  transition:
    background-color 0.15s,
    box-shadow 0.15s;

  &:disabled {
    cursor: default;
  }

  &:not(:disabled):hover,
  &:not(:disabled):focus-visible {
    background-color: oklch(1 0 0 / 0.07);
  }

  &.chosen {
    background-color: oklch(1 0 0 / 0.1);
    box-shadow: inset 0 0 0 2px var(--color-text-dim);
  }

  &.solution {
    box-shadow: inset 0 0 0 2px var(--color-win);
  }
}

.cell {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  inline-size: 100%;
  border-radius: 50%;
  background-color: var(--color-empty);
}

/* The square a disc would land on, so the click target is obvious. */
.column:not(:disabled):hover .cell.drop,
.column:not(:disabled):focus-visible .cell.drop {
  background-color: oklch(1 0 0 / 0.12);
}

.disc {
  inline-size: 78%;
  block-size: 78%;
  border-radius: 50%;
}

.glyph {
  font-weight: 700;
  font-size: clamp(0.8rem, 2.4cqi, 1.2rem);
  line-height: 1;
}

.g-win,
.g-block {
  color: var(--color-win);
}

/* Matches BoardArea's .glyph-play exactly: the marker vocabulary belongs to the
   board, not to the chrome accent. */
.g-play {
  color: oklch(0.88 0.14 255);
}

.g-opportunity {
  color: oklch(0.84 0.14 150);
}

.g-danger {
  color: oklch(0.72 0.19 25);
}

.g-controlled {
  color: oklch(0.78 0.08 220);
}

/* Threat lines: outline every square of the four, not only its open end. */
.line-danger {
  box-shadow: inset 0 0 0 2px oklch(0.72 0.19 25 / 0.75);
}

.line-opportunity {
  box-shadow: inset 0 0 0 2px oklch(0.84 0.14 150 / 0.7);
}

.line-controlled {
  box-shadow: inset 0 0 0 2px oklch(0.78 0.08 220 / 0.6);
}

.col-number {
  padding-block: 2px;
  color: var(--color-text-dim);
  font-size: 0.75rem;
  line-height: 1;
}

.column.chosen .col-number,
.column.solution .col-number {
  color: var(--color-text);
}
</style>
