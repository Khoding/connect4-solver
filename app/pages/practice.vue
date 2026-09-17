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
  /practice — the coached half of Learn mode.

  Learn mode answers a position the learner brought. This page brings the
  position instead: app/learn/drills.js searches for one whose best move
  illustrates the chosen idea, the learner commits to a column, and only then
  does the overlay and the grading appear. Everything that grades or explains
  comes from the engines already in the app (solver scores, Tier-A naming,
  VICTOR proofs), so the coaching cannot contradict the board.
-->

<template>
  <article class="practice">
    <header class="head">
      <div>
        <p class="kicker">{{ $t('drill.kicker') }}</p>
        <h1>{{ $t('drill.title') }}</h1>
        <p class="sub">{{ $t('drill.tagline') }}</p>
      </div>
      <p class="tally" :aria-label="$t('drill.tally_aria')">
        <strong>{{ tally.correct }}</strong
        ><span class="of">/</span>{{ tally.attempted }}
      </p>
    </header>

    <div class="layout">
      <div class="board-side">
        <DrillBoard
          :board="drill ? drill.board : emptyBoard"
          :cells="overlayCells"
          :lines="overlayLines"
          :chosen-col="answer?.col ?? null"
          :solution-cols="answer ? drill.bestCols : []"
          :disabled="!drill || !!answer || loading"
          @select="submit"
        />
        <p v-if="drill && !answer" class="prompt">
          <span class="to-move" :style="{backgroundColor: moverColor}" aria-hidden="true" />
          {{ $t('drill.prompt', {player: playerLabel}) }}
        </p>
      </div>

      <section class="panel" aria-live="polite">
        <!-- Which idea to drill. Changing it starts a fresh position. -->
        <label class="field">
          <span class="field-label">{{ $t('drill.concept_label') }}</span>
          <select v-model="target" class="select" @change="start()">
            <option v-for="c in DRILL_CONCEPTS" :key="c" :value="c">{{ conceptName(c) }}</option>
          </select>
        </label>

        <p v-if="loading" class="dim">{{ $t('drill.generating') }}</p>
        <p v-else-if="failed" class="dim">{{ $t('drill.not_found') }}</p>

        <!-- Before the answer: the theme, but only when the learner chose it.
             On 'Mixed' that would give away a win or a block. -->
        <p v-else-if="drill && !answer && target !== 'any'" class="theme">
          {{ $t('drill.theme', {concept: conceptLabel(drill.concept)}) }}
        </p>
        <p v-else-if="drill && !answer" class="dim">{{ $t('drill.theme_hidden') }}</p>

        <template v-if="answer">
          <p class="verdict" :class="`tier-${answer.tier}`">
            {{ $t(`moves.${answer.tier}`) }}
          </p>

          <p class="line">{{ playedText }}</p>

          <p v-if="!answer.correct" class="line">{{ shiftText }}</p>

          <!-- Two quiet moves share a name, so compare them by the things a
               human can count over the board instead. -->
          <p v-if="compareText" class="line">{{ compareText }}</p>

          <!-- The reply that punishes the move. For two quiet moves that share a
               name, this is the only thing that separates them. When the reply
               is the square the learner passed up, naming its concept would
               contradict the line below it: a claimeven is the second player's
               move by definition, so the same square is only "a developing
               move" when the first player takes it. Say what happened instead. -->
          <p v-if="refutation" class="line">
            {{
              refutation.takesBest
                ? $t('drill.refutation_takes', {col: refutation.col})
                : $t('drill.refutation', {
                    col: refutation.col,
                    concept: conceptLabel(refutation.concept),
                  })
            }}
          </p>

          <p v-if="!answer.correct" class="line">{{ bestText }}</p>

          <p class="dim explain">{{ $t(`learn.concept.${answer.bestConcept}.hint`) }}</p>

          <!-- The deepest "why" available: a rule-based proof of the outcome. -->
          <div v-if="proof" class="proof">
            <p class="proof-headline">{{ $t(`learn.pairing.headline.${proofHeadlineKey}`) }}</p>
            <p v-if="proofAnchor" class="dim">{{ proofAnchor }}</p>
          </div>

          <p v-if="overlayIsInformative" class="dim explain">{{ $t('drill.overlay_note') }}</p>
        </template>

        <div class="actions">
          <BaseButton v-if="answer" variant="accent" @click="start()">
            {{ $t('drill.next') }}
          </BaseButton>
          <BaseButton :disabled="loading" @click="start()">
            {{ answer ? $t('drill.reroll_after') : $t('drill.reroll') }}
          </BaseButton>
          <BaseButton v-if="tally.attempted" @click="resetTally">
            {{ $t('drill.reset_tally') }}
          </BaseButton>
        </div>

        <div class="panel-footer">
          <BaseButton to="/guide">{{ $t('drill.read_guide') }}</BaseButton>
          <BaseButton to="/">{{ $t('settings.back_btn') }}</BaseButton>
        </div>
      </section>
    </div>
  </article>
</template>

<script setup>
import {computed, onMounted, onUnmounted, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {useGameStore} from '@/stores/game';
import * as wasmSolver from '@/solver/index.js';
import {
  DRILL_CONCEPTS,
  explainRefutation,
  generateDrill,
  gradeAnswer,
  quietProfile,
} from '@/learn/drills';
import {buildPairing} from '@/learn/pairing';
import {ROWS, COLS} from '@/learn/threats';
import DrillBoard from '@/components/DrillBoard.vue';
import BaseButton from '@/components/BaseButton.vue';

const {t, locale} = useI18n();
const game = useGameStore();

const target = ref('any');
const drill = ref(null);
const answer = ref(null);
const refutation = ref(null);
const loading = ref(false);
const failed = ref(false);
const tally = ref({attempted: 0, correct: 0});

const emptyBoard = Array.from({length: ROWS}, () => Array(COLS).fill(0));

// Generations and refutation lookups are slow enough to outlive a click or a
// page leave, so each carries a token and a stale result is thrown away. They
// are counters rather than object identity checks: ref() hands back a reactive
// proxy, so `answer.value === graded` would never hold.
let runId = 0;
let answerId = 0;

async function start() {
  const id = ++runId;
  loading.value = true;
  failed.value = false;
  answer.value = null;
  refutation.value = null;
  drill.value = null;

  try {
    const found = await generateDrill(target.value, {
      analyze: wasmSolver.analyze,
      cancelled: () => id !== runId,
    });
    if (id !== runId) return;
    drill.value = found;
    failed.value = !found;
  } catch {
    if (id === runId) failed.value = true;
  } finally {
    if (id === runId) loading.value = false;
  }
}

async function submit(col) {
  if (!drill.value || answer.value) return;
  const graded = gradeAnswer(drill.value, col);
  if (!graded) return;
  answer.value = graded;
  refutation.value = null;
  tally.value.attempted++;
  if (graded.correct) tally.value.correct++;

  // One more solver call, for the reply that punishes the move. It arrives a
  // moment after the verdict, which is fine: the verdict does not wait on it.
  const id = ++answerId;
  const run = runId;
  const reply = await explainRefutation(drill.value, col, wasmSolver.analyze).catch(() => null);
  if (id === answerId && run === runId) refutation.value = reply;
}

function resetTally() {
  tally.value = {attempted: 0, correct: 0};
}

const playerLabel = computed(() =>
  drill.value?.player === 1 ? t('moves.player_1') : t('moves.player_2'),
);

// "Player 2" means nothing until you know which disc lands. Show the colour.
const moverColor = computed(() => (drill.value?.player === 1 ? game.color1 : game.color2));

// "4 and 6", "4 et 6", "4 und 6" — the separator is the locale's business.
function listFormat(items) {
  return new Intl.ListFormat(locale.value, {style: 'long', type: 'conjunction'}).format(
    items.map(String),
  );
}

function conceptLabel(concept) {
  return t(`learn.concept.${concept}.label`);
}

function conceptName(concept) {
  return concept === 'any' ? t('drill.concept_any') : conceptLabel(concept);
}

const playedText = computed(() => {
  const a = answer.value;
  if (!a) return '';
  if (a.correct) return t('drill.correct', {concept: conceptLabel(a.bestConcept)});
  // Naming both moves the same way teaches nothing, so say what is going on.
  if (a.playedConcept === a.bestConcept)
    return t('drill.your_move_alike', {col: a.col, concept: conceptLabel(a.playedConcept)});
  return t('drill.your_move', {col: a.col, concept: conceptLabel(a.playedConcept)});
});

// Several columns can share the best score; the board rings them all, so the
// text names them all rather than picking one and looking wrong.
const bestText = computed(() => {
  const a = answer.value;
  if (!a) return '';
  const cols = drill.value?.bestCols ?? [a.bestCol];
  const concept = conceptLabel(a.bestConcept);
  return cols.length > 1
    ? t('drill.best_move_tie', {cols: listFormat(cols), concept})
    : t('drill.best_move', {col: cols[0], concept});
});

// Only for the develop-vs-develop case, where the vocabulary runs out: how
// many untouched fours each move joins, and which row it lands on.
const compareText = computed(() => {
  const a = answer.value;
  const d = drill.value;
  if (!a || !d || a.correct || a.playedConcept !== a.bestConcept) return null;

  const mine = quietProfile(d.board, a.col - 1, d.player);
  const best = quietProfile(d.board, a.bestCol - 1, d.player);
  if (!mine || !best) return null;

  return t('drill.compare', {
    col: a.col,
    lines: mine.lines,
    bestCol: a.bestCol,
    bestLines: best.lines,
    row: t(best.onParity ? 'drill.row_yours' : 'drill.row_theirs', {row: best.row + 1}),
  });
});

const shiftText = computed(() => {
  const a = answer.value;
  if (!a) return '';
  const named = {n: a.delta, best: a.bestCol};
  // Only the slower-win line carries a count, so only it needs a plural form.
  return a.shift === 'slower'
    ? t('drill.shift.slower', named, a.delta)
    : t(`drill.shift.${a.shift}`, named);
});

// The board stays bare until the learner commits, then it shows the same threat
// map the Learn card draws — the visual half of the explanation.
const overlayCells = computed(() => (answer.value ? (drill.value?.hint.cells ?? []) : []));
const overlayLines = computed(() => (answer.value ? (drill.value?.hint.lines ?? []) : []));

// The overlay only earns a caption when it has threats to point at; on a quiet
// early board it is just the recommended squares.
const overlayIsInformative = computed(() =>
  (drill.value?.hint.cells ?? []).some(c =>
    ['opportunity', 'danger', 'controlled'].includes(c.kind),
  ),
);

const proof = computed(() => {
  if (!answer.value || !drill.value) return null;
  return buildPairing(drill.value.board, drill.value.scores, drill.value.player);
});

const proofHeadlineKey = computed(() => {
  const p = proof.value;
  if (!p) return 'draw';
  if (p.kind === 'win') return p.winner === 2 ? 'winBlack' : 'win';
  return 'draw';
});

const proofAnchor = computed(() => {
  const a = proof.value?.anchor;
  if (!a) return null;
  if (a.kind === 'oddThreat') return t('learn.pairing.anchor.oddThreat', {sq: a.name});
  if (a.kind === 'immediate') return t('learn.pairing.anchor.immediate', {col: a.col});
  if (a.kind === 'aftereven')
    return t('learn.pairing.anchor.aftereven', {sq: (a.names || []).join(', ')});
  if (a.kind === 'threatCombination')
    return t('learn.pairing.anchor.combination', {a: a.crossing.name, b: a.other.name});
  return null;
});

useSeoMeta({
  title: () => t('drill.seo.title'),
  description: () => t('drill.seo.description'),
  ogTitle: () => t('drill.seo.title'),
  ogDescription: () => t('drill.seo.description'),
  ogType: 'website',
  twitterCard: 'summary',
});

onMounted(() => {
  game.init();
  start();
  window.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  runId++; // abandon any generation still walking
  window.removeEventListener('keydown', onKeydown);
});

function onKeydown(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  if (e.key >= '1' && e.key <= '7') submit(Number(e.key));
  if (e.key.toLowerCase() === 'n') start();
}
</script>

<style scoped>
.practice {
  container-type: inline-size;
  max-inline-size: 64rem;
  margin-inline: auto;
  padding-inline: clamp(1rem, 4vw, 2rem);
  padding-block: clamp(1rem, 4vw, 2.5rem);
}

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  margin-block-end: clamp(1rem, 3vw, 1.75rem);
  gap: 1rem;
}

.kicker {
  margin: 0;
  color: var(--color-accent);
  font-weight: 700;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1 {
  margin-block: 0.25rem 0.4rem;
  font-size: clamp(1.5rem, 4vw, 2.2rem);
  line-height: 1.15;
}

.sub {
  margin: 0;
  color: var(--color-text-dim);
  font-size: clamp(0.9rem, 2vw, 1.05rem);
}

.tally {
  margin: 0;
  padding: 8px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
  font-family: var(--font-mono);
  font-size: 1.1rem;

  & strong {
    color: var(--color-accent);
  }

  & .of {
    margin-inline: 0.15rem;
    color: var(--color-text-dim);
  }
}

.layout {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: clamp(1rem, 3vw, 2rem);
}

.board-side {
  flex: 1 1 20rem;
  min-inline-size: min(100%, 18rem);
}

.prompt {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-block: 0.75rem 0;
  gap: 0.45rem;
  color: var(--color-text-dim);
}

/* The disc about to land, so "Player 2" reads as a colour on the board. */
.to-move {
  inline-size: 0.85em;
  block-size: 0.85em;
  border-radius: 50%;
  box-shadow: 0 0 0 1px oklch(1 0 0 / 0.25);
}

.panel {
  display: flex;
  flex: 1 1 18rem;
  flex-direction: column;
  padding: clamp(0.85rem, 2vw, 1.15rem);
  gap: 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.field-label {
  color: var(--color-text-dim);
  font-size: 0.8rem;
}

.select {
  padding: 8px 10px;
  border: 1px solid var(--color-border-interactive);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface-alt);
  color: var(--color-text);
  font: inherit;
  font-size: 0.9rem;
}

.theme {
  margin: 0;
  font-size: 0.95rem;
}

.verdict {
  margin: 0;
  font-weight: 700;
  font-size: 1.05rem;
}

.tier-best {
  color: oklch(0.78 0.15 150);
}

.tier-good {
  color: oklch(0.82 0.13 130);
}

.tier-inaccuracy {
  color: oklch(0.85 0.15 95);
}

.tier-mistake {
  color: oklch(0.74 0.17 55);
}

.tier-blunder {
  color: oklch(0.7 0.19 25);
}

.line {
  margin: 0;
  font-size: 0.95rem;
}

.dim {
  margin: 0;
  color: var(--color-text-dim);
  font-size: 0.85rem;
}

.explain {
  line-height: 1.5;
}

.proof {
  margin-block-start: 0.2rem;
  padding-block-start: 0.6rem;
  border-block-start: 1px solid var(--color-border);
}

.proof-headline {
  margin: 0 0 0.2rem;
  color: oklch(0.85 0.16 90);
  font-weight: 700;
  font-size: 0.9rem;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  margin-block-start: 0.4rem;
  gap: 0.5rem;
}

.panel-footer {
  display: flex;
  flex-wrap: wrap;
  margin-block-start: auto;
  padding-block-start: 0.75rem;
  gap: 0.5rem;
  border-block-start: 1px solid var(--color-border);
}
</style>
