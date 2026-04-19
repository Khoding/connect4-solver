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
  <div class="rules-container">
    <div class="info-card">
      <h3>Recognized Openings (by 2swap)</h3>
      <div class="openings-list">
        <ul class="openings-columns">
          <li v-for="(opening, i) in gameStore.prefixList" :key="i">
            <strong>{{ Object.keys(opening)[0] }}</strong
            >:
            <span class="mono">{{ Object.values(opening)[0].join(', ') || '(Empty)' }}</span>
          </li>
        </ul>
      </div>
    </div>

    <div class="info-card">
      <h3>How it works</h3>
      <p>
        Connect 4 is a <strong>solved game</strong>. With perfect play, the first player can always
        force a win. This app uses a perfect solver to analyze every position and suggest the
        optimal move.
      </p>
      <p>
        The solver runs entirely in your browser via WebAssembly — no server required. It uses
        alpha-beta pruning with a transposition table and a 32 MB opening book for instant responses
        in early-game positions.
      </p>
    </div>

    <div class="info-card">
      <h3>Reading the scores</h3>
      <p>Each column gets a score relative to the current player:</p>
      <ul>
        <li>
          <strong>Positive (+N)</strong> — Playing here leads to a forced win. Higher = faster win.
        </li>
        <li><strong>Zero (0)</strong> — This move leads to a draw with perfect play.</li>
        <li><strong>Negative (−N)</strong> — Playing here leads to a loss. Lower = faster loss.</li>
        <li><strong>— (dash)</strong> — Column is full.</li>
      </ul>
    </div>

    <div class="info-card">
      <h3>Credits</h3>
      <p>
        Solver engine by
        <a href="http://connect4.gamesolver.org" target="_blank" rel="noopener">Pascal Pons</a>
        (AGPL-3.0). Compiled to WebAssembly for local use.
      </p>
      <p>
        Inspired by
        <a href="https://2swap.github.io/WeakC4/" target="_blank" rel="noopener">2swap's WeakC4</a>
        weak solution explorer.
      </p>
      <p>
        <a href="https://github.com/Khoding/connect4-solver" target="_blank" rel="noopener"
          >GitHub Repository</a
        >
      </p>
      <p>
        Source code licensed under
        <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener"
          >AGPL-3.0</a
        >.
      </p>
    </div>

    <div style="margin-block-start: 1.5rem; text-align: center">
      <RouterLink to="/" class="back-btn">Back to Solver</RouterLink>
    </div>
  </div>
</template>

<script setup>
import {useGameStore} from '@/stores/game';

const gameStore = useGameStore();
</script>

<style scoped>
.rules-container {
  max-width: 600px;
  margin: 0 auto;
}

.info-card {
  & + .info-card {
    margin-block-start: 1.5rem;
  }

  & p {
    margin-block-start: 0.5rem;
    color: var(--color-text-dim);
    font-size: 0.9rem;
    line-height: 1.6;
  }

  & ul {
    margin-block-start: 0.5rem;
    padding-inline-start: 1.2rem;
    color: var(--color-text-dim);
    font-size: 0.9rem;
    line-height: 1.6;
  }

  & li {
    margin-block-end: 0.3rem;
  }

  & a {
    color: var(--color-accent);
  }
}

.openings-list {
  margin-block-start: 1rem;
}

.openings-columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  padding: 0;
  gap: 0.5rem;
  list-style: none;

  & li {
    margin: 0;
    color: var(--color-text-dim);
    font-size: 0.85rem;
  }

  & strong {
    color: var(--color-text);
  }

  & .mono {
    color: oklch(0.8 0.1 220);
    font-size: 0.8rem;
    font-family: var(--font-mono);
  }
}

.back-btn {
  display: inline-block;
  padding: 10px 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
  color: var(--color-text);
  text-decoration: none;
  transition: background-color 0.15s;

  &:hover {
    background-color: var(--color-surface-alt);
  }
}
</style>
