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

<template>
  <section class="info-card steady-card" aria-labelledby="steady-heading">
    <h2 id="steady-heading" class="card-heading">{{ $t('steady.title') }}</h2>

    <div class="ss-grid" role="img" :aria-label="$t('steady.aria')">
      <template v-for="vr in game.ROWS" :key="vr">
        <div
          v-for="c in game.COLS"
          :key="`${vr}-${c}`"
          class="ss-cell"
          :class="{occupied: !!discColor(game.ROWS - vr, c - 1)}"
        >
          <span
            v-if="discColor(game.ROWS - vr, c - 1)"
            class="ss-disc"
            :style="{backgroundColor: discColor(game.ROWS - vr, c - 1)}"
          />
          <span
            v-else-if="glyphAt(game.ROWS - vr, c - 1)"
            class="ss-glyph"
            :class="`glyph-${glyphAt(game.ROWS - vr, c - 1).kind}`"
          >
            {{ glyphAt(game.ROWS - vr, c - 1).char }}
          </span>
        </div>
      </template>
    </div>

    <p v-if="!game.steadyOverlay" class="dim hint">{{ $t('steady.empty') }}</p>
    <ul v-else class="legend">
      <li><span class="ss-glyph glyph-play">◎</span>{{ $t('steady.legend.play') }}</li>
      <li>
        <span class="ss-glyph glyph-opportunity">○</span>{{ $t('steady.legend.opportunity') }}
      </li>
      <li><span class="ss-glyph glyph-danger">✕</span>{{ $t('steady.legend.danger') }}</li>
    </ul>
  </section>
</template>

<script setup>
import {computed} from 'vue';
import {useGameStore} from '@/stores/game';

const game = useGameStore();

// Mirror BoardArea's glyph vocabulary so the diagram reads the same as the board.
const GLYPH_CHARS = {win: '✦', block: '✦', play: '◎', opportunity: '○', danger: '✕'};

const glyphMap = computed(() => {
  const map = {};
  const overlay = game.steadyOverlay;
  if (!overlay) return map;
  for (const cell of overlay.cells) {
    map[`${cell.row}-${cell.col}`] = {kind: cell.kind, char: GLYPH_CHARS[cell.kind] ?? '•'};
  }
  return map;
});

/** Display color for an occupied cell (row indexed from the bottom), else null. */
function discColor(row, col) {
  const v = game.boardArr[row]?.[col];
  if (!v) return null;
  return game.displayColorOf(v);
}

function glyphAt(row, col) {
  return glyphMap.value[`${row}-${col}`] || null;
}
</script>

<style scoped>
.info-card {
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
}

.ss-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-block-start: 0.75rem;
  padding: 6px;
  gap: 4px;
  border-radius: var(--radius-sm);
  background-color: var(--color-surface-alt);
}

.ss-cell {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  border-radius: 50%;
  background-color: var(--color-surface);
}

.ss-disc {
  inline-size: 80%;
  block-size: 80%;
  border-radius: 50%;
}

.ss-glyph {
  font-weight: 700;
  font-size: clamp(0.7rem, 4cqw, 1.1rem);
  line-height: 1;

  &.glyph-win {
    color: oklch(0.85 0.18 145);
  }

  &.glyph-block {
    color: oklch(0.82 0.17 255);
  }

  &.glyph-play {
    color: oklch(0.88 0.14 255);
  }

  &.glyph-opportunity {
    color: oklch(0.82 0.16 145 / 0.85);
  }

  &.glyph-danger {
    color: oklch(0.8 0.18 25);
  }
}

.hint {
  margin-block-start: 0.5rem;
}

.dim {
  margin: 0;
  color: var(--color-text-dim);
  font-size: 0.8rem;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  margin-block-start: 0.6rem;
  padding: 0;
  gap: 0.5rem 1rem;
  list-style: none;

  & li {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    color: var(--color-text-dim);
    font-size: 0.75rem;
  }

  & .ss-glyph {
    font-size: 0.9rem;
  }
}
</style>
