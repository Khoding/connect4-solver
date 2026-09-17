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
  /guide — a long-form introduction to Connect 4 theory, from "the game is
  solved" through Allis's pairing rules to a practical play plan, plus a
  reference section on reading the Learn-mode overlay.

  This file holds no prose. The essay lives in i18n/locales/guide-{en,fr,de}.js
  as a list of typed blocks, and this template walks it, so translating the
  guide never means touching markup and adding a language is one new file. The
  block vocabulary is documented at the top of guide-en.js.

  Section 6 documents the marker vocabulary defined in app/learn/classifier.js,
  app/learn/pairing.js and BoardArea.vue. Keep the three legends in the content
  files in sync when those glyphs or the label order change.

  The diagrams stay live: each {diagram} block names a curated position from
  app/learn/examples.js whose plan PairingMiniBoard generates from the
  solver-validated VICTOR rules, so no caption can drift from what is proven.
-->

<template>
  <article class="guide">
    <header class="hero">
      <p class="kicker">{{ t('guide.kicker') }}</p>
      <!-- eslint-disable-next-line vue/no-v-html -- repo-authored prose, never user input -->
      <h1 v-html="t('guide.title')" />
      <!-- eslint-disable-next-line vue/no-v-html -- repo-authored prose, never user input -->
      <p class="sub" v-html="localize(t('guide.sub'))" />
      <nav class="toc" :aria-label="t('guide.tocLabel')">
        <a v-for="item in tm('guide.toc')" :key="item.id" :href="`#${item.id}`">{{ item.label }}</a>
      </nav>
    </header>

    <section v-for="section in tm('guide.sections')" :id="section.id" :key="section.id">
      <h2>{{ section.h2 }}</h2>

      <template v-for="(block, i) in section.blocks" :key="i">
        <h3 v-if="block.h3">{{ block.h3 }}</h3>

        <!-- eslint-disable-next-line vue/no-v-html -- repo-authored prose, never user input -->
        <p v-else-if="block.p" v-html="localize(block.p)" />

        <ul v-else-if="block.ul" class="points">
          <!-- eslint-disable-next-line vue/no-v-html -- repo-authored prose, never user input -->
          <li v-for="(li, j) in block.ul" :key="j" v-html="localize(li)" />
        </ul>

        <ol v-else-if="block.ol" class="steps">
          <!-- eslint-disable-next-line vue/no-v-html -- repo-authored prose, never user input -->
          <li v-for="(li, j) in block.ol" :key="j" v-html="localize(li)" />
        </ol>

        <details v-else-if="block.details" class="deep">
          <summary>{{ block.details.summary }}</summary>
          <!-- eslint-disable-next-line vue/no-v-html -- repo-authored prose, never user input -->
          <p v-for="(para, j) in block.details.body" :key="j" v-html="localize(para)" />
        </details>

        <PairingMiniBoard
          v-else-if="block.diagram"
          class="diagram"
          :example="ex(block.diagram.example)"
          :caption="block.diagram.caption"
        />

        <dl v-else-if="block.legend" class="legend-list">
          <div v-for="(entry, j) in block.legend" :key="j">
            <dt>
              <span class="g" :class="entry.cls">{{ entry.char }}</span> {{ entry.term }}
            </dt>
            <!-- eslint-disable-next-line vue/no-v-html -- repo-authored prose, never user input -->
            <dd v-html="localize(entry.desc)" />
          </div>
        </dl>

        <p v-else-if="block.cta" class="cta">
          <BaseButton
            v-for="(button, j) in block.cta"
            :key="j"
            :to="button.to"
            :variant="button.variant"
            >{{ button.label }}</BaseButton
          >
        </p>
      </template>
    </section>

    <footer class="end">
      <!-- eslint-disable-next-line vue/no-v-html -- repo-authored prose, never user input -->
      <p class="dim" v-html="localize(t('guide.footer'))" />
    </footer>
  </article>
</template>

<script setup>
import {useI18n} from 'vue-i18n';
import {EXAMPLES} from '@/learn/examples';
import PairingMiniBoard from '@/components/guide/PairingMiniBoard.vue';
import BaseButton from '@/components/BaseButton.vue';

// `tm` returns the raw message tree rather than a formatted string, which is how
// the block lists and the table of contents come back as arrays of objects.
const {t, tm} = useI18n();
const localePath = useLocalePath();
const ex = id => EXAMPLES.find(e => e.id === id);

// Links inside the prose are plain <a> tags in the content files, so they never
// pass through NuxtLinkLocale and would send a French reader to the English
// route. Rewrite internal hrefs through localePath on the way out.
const localize = html =>
  html.replace(/href="(\/[^"]*)"/g, (_, path) => `href="${localePath(path)}"`);

useSeoMeta({
  title: () => t('guide.seo.title'),
  description: () => t('guide.seo.description'),
  ogTitle: () => t('guide.seo.title'),
  ogDescription: () => t('guide.seo.description'),
  ogType: 'article',
  twitterCard: 'summary',
});
</script>

<style scoped>
.guide {
  container-type: inline-size;
  max-inline-size: 52rem;
  margin-inline: auto;
  padding-inline: clamp(1rem, 4vw, 2rem);
  padding-block: clamp(1.5rem, 5vw, 3.5rem);
  line-height: 1.65;
}

.hero {
  margin-block-end: clamp(2rem, 6vw, 3.5rem);
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
  margin-block: 0.4rem 0.75rem;
  font-size: clamp(1.8rem, 5vw, 2.8rem);
  line-height: 1.15;
}

.sub {
  margin: 0;
  color: var(--color-text-dim);
  font-size: clamp(1rem, 2.2vw, 1.2rem);
}

.toc {
  display: flex;
  flex-wrap: wrap;
  margin-block-start: 1.5rem;
  padding-block-start: 1.25rem;
  gap: 0.5rem 1rem;
  border-block-start: 1px solid var(--color-border);

  & a {
    color: var(--color-text-dim);
    font-size: 0.9rem;
    text-decoration: none;
    transition: color 160ms ease;
  }

  & a:hover {
    color: var(--color-accent);
  }
}

section {
  margin-block-end: clamp(2.5rem, 7vw, 4rem);
  scroll-margin-block-start: 1.5rem;
}

h2 {
  margin-block: 0 1rem;
  font-size: clamp(1.4rem, 3.5vw, 2rem);
  line-height: 1.2;
}

h3 {
  margin-block: 1.75rem 0.5rem;
  color: var(--color-accent);
  font-size: clamp(1.1rem, 2.4vw, 1.35rem);
}

p {
  margin-block: 0 1rem;
}

.points,
.steps {
  margin-block: 0 1rem;
  padding-inline-start: 1.25rem;

  & li {
    margin-block: 0.4rem;
  }
}

.deep {
  margin-block: 0.75rem 1.25rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);

  & summary {
    color: var(--color-accent);
    font-weight: 600;
    cursor: pointer;
  }

  & p {
    margin-block-start: 0.75rem;
  }

  &[open] summary {
    margin-block-end: 0.25rem;
  }
}

/* Marker legends: a glyph + name on one side, what it means on the other. */
.legend-list {
  display: grid;
  margin-block: 0 1.25rem;
  padding: clamp(0.5rem, 2vw, 0.9rem);
  gap: 0.15rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);

  & > div {
    display: grid;
    padding-block: 0.4rem;
    gap: 0.1rem 1rem;
  }

  & > div + div {
    border-block-start: 1px solid var(--color-border);
  }

  & dt {
    font-weight: 600;
    font-size: 0.95rem;
  }

  & dd {
    margin: 0;
    color: var(--color-text-dim);
    font-size: 0.9rem;
  }

  @container (min-width: 34rem) {
    & > div {
      grid-template-columns: 13rem 1fr;
      align-items: baseline;
    }
  }
}

/* Glyph swatches mirror BoardArea/pairing.js so the legend reads like the board. */
.g {
  display: inline-block;
  min-inline-size: 1.2em;
  font-size: 1.05em;
  line-height: 1;
  text-align: center;
}

.g-win {
  color: oklch(0.88 0.16 90);
}

.g-play {
  color: oklch(0.88 0.14 255);
}

.g-opp {
  color: oklch(0.84 0.14 150);
}

.g-danger {
  color: oklch(0.72 0.19 25);
}

.g-ctrl {
  color: oklch(0.78 0.08 220);
}

.rule-claimeven {
  color: oklch(0.8 0.14 300);
}

.rule-baseinverse {
  color: oklch(0.82 0.13 255);
}

.rule-vertical {
  color: oklch(0.84 0.12 200);
}

.rule-aftereven {
  color: oklch(0.84 0.15 150);
}

.rule-lowinverse {
  color: oklch(0.86 0.14 60);
}

.rule-highinverse {
  color: oklch(0.8 0.15 30);
}

.rule-baseclaim {
  color: oklch(0.82 0.16 350);
}

.rule-before {
  color: oklch(0.84 0.14 110);
}

/* The interactive diagrams get room and a calm frame. */
.diagram {
  margin-block: 1.5rem;
  padding: clamp(0.75rem, 2vw, 1.25rem);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
}

.cta {
  display: flex;
  flex-wrap: wrap;
  margin-block-start: 1.5rem;
  gap: 0.6rem;
}

.end {
  margin-block-start: 3rem;
  padding-block-start: 1.5rem;
  border-block-start: 1px solid var(--color-border);
}

.dim {
  color: var(--color-text-dim);
  font-size: 0.9rem;
}
</style>
