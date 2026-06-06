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
  <section class="info-card" aria-labelledby="learn-heading">
    <h2 id="learn-heading" class="card-heading">{{ $t('learn.title') }}</h2>

    <div class="mode-switch" role="group" :aria-label="$t('learn.mode_aria')">
      <button
        type="button"
        :class="{active: !game.learnActive}"
        :aria-pressed="!game.learnActive"
        @click="game.setMode('solver')"
      >
        {{ $t('learn.mode_solver') }}
      </button>
      <button
        type="button"
        :class="{active: game.learnActive}"
        :aria-pressed="game.learnActive"
        @click="game.setMode('learn')"
      >
        {{ $t('learn.mode_learn') }}
      </button>
    </div>

    <div v-show="game.learnActive" class="hint" aria-live="polite">
      <p v-if="game.gameOver" class="dim">{{ $t('learn.game_over') }}</p>
      <p v-else-if="!hint" class="dim">{{ $t('learn.thinking') }}</p>

      <template v-else>
        <p class="concept">
          {{ $t('learn.hint_intro') }}
          <strong :class="`concept-${hint.concept}`">{{
            $t(`learn.concept.${hint.concept}.label`)
          }}</strong>
        </p>
        <p class="dim explain">{{ $t(`learn.concept.${hint.concept}.hint`) }}</p>

        <p v-if="game.learnRevealLevel >= 1 && game.learnRevealLevel < 2" class="dim glyph-note">
          {{ $t('learn.glyph_note') }}
        </p>

        <p v-if="game.learnRevealLevel >= 2" class="reveal">
          {{ $t('learn.exact_move', {col: hint.bestCol}) }}
        </p>

        <button
          v-if="game.learnRevealLevel < 2"
          type="button"
          class="escalate"
          @click="game.revealMoreHint()"
        >
          {{ game.learnRevealLevel < 1 ? $t('learn.show_board') : $t('learn.reveal_move') }}
        </button>
      </template>

      <!-- Tier C: the rule-based pairing that proves the win/draw. -->
      <div v-if="game.pairing" class="pairing">
        <button type="button" class="escalate pairing-toggle" @click="game.togglePairing()">
          {{ game.showPairing ? $t('learn.pairing.hide') : $t('learn.pairing.show') }}
        </button>

        <template v-if="game.showPairing">
          <p class="pairing-headline" :class="`pairing-${game.pairing.kind}`">
            {{ $t(`learn.pairing.headline.${headlineKey}`) }}
          </p>
          <p v-if="anchorText" class="anchor">{{ anchorText }}</p>
          <ul class="rule-list">
            <li v-for="(count, type) in game.pairing.counts" :key="type">
              <span class="diamond" aria-hidden="true">◆</span>
              {{ $t(`learn.pairing.rule.${type}`) }}
              <span v-if="count > 1" class="times">×{{ count }}</span>
            </li>
          </ul>
          <p class="dim">{{ $t('learn.pairing.covers', {n: game.pairing.threatsCovered}) }}</p>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup>
import {computed} from 'vue';
import {useI18n} from 'vue-i18n';
import {useGameStore} from '@/stores/game';

const game = useGameStore();
const {t} = useI18n();
const hint = computed(() => game.learnHint);

// The win headline depends on which player it belongs to (first vs second).
const headlineKey = computed(() => {
  const p = game.pairing;
  if (!p) return 'draw';
  if (p.kind === 'win') return p.winner === 2 ? 'winBlack' : 'win';
  return 'draw';
});

// One-line description of what forces the win (the focal point of a win pairing).
const anchorText = computed(() => {
  const a = game.pairing?.anchor;
  if (!a) return null;
  if (a.kind === 'oddThreat') return t('learn.pairing.anchor.oddThreat', {sq: a.name});
  if (a.kind === 'immediate') return t('learn.pairing.anchor.immediate', {col: a.col});
  if (a.kind === 'aftereven') return t('learn.pairing.anchor.aftereven', {sq: (a.names || []).join(', ')});
  if (a.kind === 'threatCombination')
    return t('learn.pairing.anchor.combination', {a: a.crossing.name, b: a.other.name});
  return null;
});
</script>

<style scoped>
.info-card {
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
}

.mode-switch {
  display: flex;
  margin-block-start: 0.75rem;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);

  & button {
    flex: 1;
    padding: 8px 10px;
    border: none;
    background-color: var(--color-surface);
    color: var(--color-text-dim);
    font: inherit;
    font-weight: 600;
    font-size: 0.8rem;
    cursor: pointer;
    transition:
      background-color 0.15s,
      color 0.15s;

    &:hover {
      color: var(--color-text);
    }

    &.active {
      background-color: var(--color-accent, oklch(0.65 0.18 255));
      color: var(--color-bg);
    }
  }
}

.hint {
  margin-block-start: 0.75rem;
}

.concept {
  margin: 0;
  font-size: 0.9rem;
}

.concept strong {
  text-transform: lowercase;
}

.concept-win {
  color: oklch(0.78 0.16 145);
}

.concept-block {
  color: oklch(0.78 0.16 25);
}

.concept-odd_threat,
.concept-even_threat {
  color: oklch(0.78 0.14 255);
}

.concept-claimeven {
  color: oklch(0.8 0.13 195);
}

.concept-develop {
  color: var(--color-text);
}

.dim {
  margin: 0;
  color: var(--color-text-dim);
  font-size: 0.8rem;
}

.explain {
  margin-block-start: 0.35rem;
}

.glyph-note {
  margin-block-start: 0.5rem;
  font-style: italic;
}

.reveal {
  margin-block-start: 0.5rem;
  font-weight: 700;
  font-size: 0.95rem;
}

.pairing {
  margin-block-start: 0.85rem;
  padding-block-start: 0.75rem;
  border-block-start: 1px solid var(--color-border);
}

.pairing-toggle {
  margin-block-start: 0;
}

.pairing-headline {
  margin: 0;
  margin-block-start: 0.6rem;
  font-weight: 700;
  font-size: 0.95rem;
}

.pairing-win {
  color: oklch(0.85 0.16 90);
}

.pairing-draw {
  color: oklch(0.8 0.13 195);
}

.anchor {
  margin: 0;
  margin-block-start: 0.3rem;
  font-size: 0.85rem;
}

.rule-list {
  margin: 0;
  margin-block-start: 0.5rem;
  padding-inline-start: 0;
  list-style: none;

  & li {
    display: flex;
    align-items: center;
    padding-block: 2px;
    gap: 0.4rem;
    font-size: 0.85rem;
  }

  & .diamond {
    color: oklch(0.8 0.12 300);
    font-size: 0.7rem;
  }

  & .times {
    color: var(--color-text-dim);
    font-family: var(--font-mono);
  }
}

.escalate {
  margin-block-start: 0.75rem;
  padding: 8px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface-alt);
  color: var(--color-text);
  font: inherit;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  transition:
    background-color 0.15s,
    border-color 0.15s;

  &:hover {
    border-color: var(--color-text-dim);
    background-color: var(--color-surface);
  }
}
</style>
