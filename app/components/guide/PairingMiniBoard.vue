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
  Self-contained teaching diagram for one curated example (app/learn/examples.js).
  It builds the board and the VICTOR pairing locally from the example's known
  outcome — no store, no WASM — and lets the reader toggle the rule-based plan
  the same way the live Learn card does: violet diamonds for reserved squares,
  per-rule rings, a gold star on the square that forces the win.
-->

<template>
  <figure class="mini">
    <div class="board" :class="{revealed}" role="img" :aria-label="caption">
      <template v-for="r in ROWS" :key="r">
        <div
          v-for="c in COLS"
          :key="`${r}-${c}`"
          class="cell"
          :class="{ring: revealed && rings.has(`${ROWS - r}-${c - 1}`)}"
          :style="
            revealed && ringColors[`${ROWS - r}-${c - 1}`]
              ? {'--ring-color': ringColors[`${ROWS - r}-${c - 1}`]}
              : null
          "
        >
          <span
            v-if="discAt(ROWS - r, c - 1)"
            class="disc"
            :class="`p${discAt(ROWS - r, c - 1)}`"
          />
          <span
            v-else-if="revealed && glyphs[`${ROWS - r}-${c - 1}`]"
            class="glyph"
            :class="`g-${glyphs[`${ROWS - r}-${c - 1}`].kind}`"
            :style="
              glyphs[`${ROWS - r}-${c - 1}`].color
                ? {color: glyphs[`${ROWS - r}-${c - 1}`].color}
                : null
            "
            >{{ glyphs[`${ROWS - r}-${c - 1}`].char }}</span
          >
        </div>
      </template>
    </div>

    <figcaption class="cap">
      <p class="lead">{{ caption }}</p>

      <button type="button" class="toggle" @click="revealed = !revealed">
        {{ revealed ? $t('learn.pairing.hide') : $t('learn.pairing.show') }}
      </button>

      <div v-if="revealed && pairing" class="plan">
        <p class="headline" :class="`is-${pairing.kind}`">
          {{ $t(`learn.pairing.headline.${headlineKey}`) }}
        </p>
        <p v-if="anchorText" class="anchor">{{ anchorText }}</p>
        <ul class="rules">
          <li v-for="(count, type) in pairing.counts" :key="type">
            <span class="dot" :style="{color: ruleStyle(type).color}" aria-hidden="true">{{
              ruleStyle(type).char
            }}</span>
            {{ $t(`learn.pairing.rule.${type}`) }}
            <span v-if="count > 1" class="times">×{{ count }}</span>
          </li>
        </ul>
        <p class="covers">{{ $t('learn.pairing.covers', {n: pairing.threatsCovered}) }}</p>
      </div>
    </figcaption>
  </figure>
</template>

<script setup>
import {computed, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {ROWS, COLS} from '@/learn/threats';
import {boardFromMoves} from '@/learn/examples';
import {buildPairingForOutcome, squareName, ruleStyle} from '@/learn/pairing';

const props = defineProps({
  example: {type: Object, required: true},
  caption: {type: String, default: ''},
});

const {t} = useI18n();
const revealed = ref(false);

const board = computed(() => boardFromMoves(props.example.moves));
const pairing = computed(() => buildPairingForOutcome(board.value, props.example.outcome));

function discAt(row, col) {
  return board.value[row]?.[col] || 0;
}

const headlineKey = computed(() => {
  const p = pairing.value;
  if (!p) return 'draw';
  if (p.kind === 'win') return p.winner === 2 ? 'winBlack' : 'win';
  return 'draw';
});

const anchorText = computed(() => {
  const a = pairing.value?.anchor;
  if (!a) return null;
  if (a.kind === 'oddThreat') return t('learn.pairing.anchor.oddThreat', {sq: a.name});
  if (a.kind === 'immediate') return t('learn.pairing.anchor.immediate', {col: a.col});
  if (a.kind === 'aftereven')
    return t('learn.pairing.anchor.aftereven', {sq: (a.names || []).join(', ')});
  if (a.kind === 'threatCombination')
    return t('learn.pairing.anchor.combination', {a: a.crossing.name, b: a.other.name});
  return null;
});

// Reserved squares → ◆; the anchor square(s) → ★ / ✦. Mirrors BoardArea.
const glyphs = computed(() => {
  const map = {};
  const p = pairing.value;
  if (!p) return map;
  for (const cell of p.cells) {
    const s = ruleStyle(cell.type);
    map[`${cell.row}-${cell.col}`] = {kind: 'pairing', char: s.char, color: s.color};
  }
  const a = p.anchor;
  if (a?.kind === 'oddThreat') {
    map[`${a.row}-${a.col}`] = {kind: 'star', char: '★'};
  } else if (a?.kind === 'threatCombination') {
    map[`${a.crossing.row}-${a.crossing.col}`] = {kind: 'star', char: '★'};
    map[`${a.other.row}-${a.other.col}`] = {kind: 'star', char: '★'};
  } else if (a?.kind === 'aftereven') {
    for (const [r, c] of a.cells)
      if (discAt(r, c) === 0) map[`${r}-${c}`] = {kind: 'star', char: '★'};
  } else if (a?.kind === 'immediate') {
    const col = a.col - 1;
    for (let y = 0; y < ROWS; y++)
      if (discAt(y, col) === 0) {
        map[`${y}-${col}`] = {kind: 'win', char: '✦'};
        break;
      }
  }
  return map;
});

// Every square bound by a rule group or the anchor line gets a quiet ring.
const rings = computed(() => {
  const set = new Set();
  const p = pairing.value;
  if (!p) return set;
  for (const g of p.groups) for (const [r, c] of g.cells) set.add(`${r}-${c}`);
  const a = p.anchor;
  if ((a?.kind === 'oddThreat' || a?.kind === 'aftereven') && a.cells)
    for (const [r, c] of a.cells) set.add(`${r}-${c}`);
  return set;
});

// Ring colour per reserved square, matching its rule's glyph colour.
const ringColors = computed(() => {
  const map = {};
  const p = pairing.value;
  if (!p) return map;
  for (const cell of p.cells) map[`${cell.row}-${cell.col}`] = ruleStyle(cell.type).color;
  return map;
});

// Exposed for potential debugging / tests.
defineExpose({squareName});
</script>

<style scoped>
.mini {
  display: flex;
  flex-direction: column;
  margin: 0;
  gap: 0.75rem;
}

@container (min-inline-size: 34rem) {
  .mini {
    flex-direction: row;
    align-items: flex-start;
  }
}

.board {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  flex: 0 0 auto;
  inline-size: min(100%, 19rem);
  padding: 6px;
  gap: 4px;
  border-radius: var(--radius-sm);
  background-color: oklch(0.45 0.13 255);
}

.cell {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  border-radius: 50%;
  background-color: oklch(0.16 0.03 265);
  transition: box-shadow 160ms ease;
}

/* A square the pairing plan binds together, tinted with its rule's colour. */
.cell.ring {
  box-shadow: inset 0 0 0 2px var(--ring-color, oklch(0.78 0.13 300 / 0.85));
}

.disc {
  inline-size: 82%;
  block-size: 82%;
  border-radius: 50%;

  &.p1 {
    background-color: oklch(0.62 0.21 25);
  }

  &.p2 {
    background-color: oklch(0.85 0.16 95);
  }
}

.glyph {
  font-weight: 700;
  font-size: clamp(0.7rem, 4cqw, 1rem);
  line-height: 1;

  &.g-pairing {
    color: oklch(0.8 0.12 300 / 0.9);
    font-size: clamp(0.55rem, 3cqw, 0.8rem);
  }

  &.g-star {
    color: oklch(0.85 0.16 90);
    text-shadow: 0 0 8px oklch(0.85 0.16 90 / 0.6);
  }

  &.g-win {
    color: oklch(0.85 0.18 145);
  }
}

.cap {
  flex: 1 1 auto;
  min-inline-size: 0;
}

.lead {
  margin-block: 0 0.6rem;
  color: var(--color-text);
}

.toggle {
  padding-inline: 12px;
  padding-block: 6px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface-alt);
  color: var(--color-text);
  font: inherit;
  cursor: pointer;
  transition: background-color 160ms ease;

  &:hover {
    background-color: var(--color-surface);
  }
}

.plan {
  margin-block-start: 0.75rem;
}

.headline {
  margin-block: 0 0.4rem;
  font-weight: 700;

  &.is-win {
    color: oklch(0.85 0.16 90);
  }

  &.is-draw {
    color: oklch(0.82 0.13 195);
  }
}

.anchor {
  margin-block: 0 0.5rem;
  color: var(--color-text);
}

.rules {
  margin-block: 0.25rem;
  padding-inline-start: 0;
  list-style: none;

  & li {
    margin-block: 0.2rem;
    color: var(--color-text);
  }
}

.dot {
  color: oklch(0.8 0.12 300 / 0.9);
}

.times {
  color: var(--color-text-dim);
  font-variant-numeric: tabular-nums;
}

.covers {
  margin-block: 0.5rem 0;
  color: var(--color-text-dim);
  font-size: 0.85rem;
}
</style>
