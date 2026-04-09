<template>
  <div class="rules-container">
    <div class="info-card rules" open>
      <h3>How to read the steady-state</h3>
      <ol>
        <li><strong>Win</strong> — Make a winning move, if available.</li>
        <li><strong>Block</strong> — Block an opponent winning move, if available.</li>
        <li><strong class="symbol">!</strong> <em>(urgent)</em> — Play on it, if available.</li>
        <li>
          <strong class="symbol">@</strong> <em>(miai)</em> — Play on it, only if exactly one is
          available.
        </li>
        <li>
          <strong class="symbol">|</strong> <em>(claimodd)</em> — Play on it only if on an
          <strong>odd row</strong> (1, 3, 5 from bottom).<br />
          <strong class="symbol">·</strong> <em>(claimeven)</em> — Play on it only if on an
          <strong>even row</strong> (2, 4, 6 from bottom). Shown as <code>·</code> (dot) in the
          diagram.
        </li>
        <li><strong class="symbol">+</strong> — Play on it, if available.</li>
        <li><strong class="symbol">=</strong> — Play on it, if available.</li>
        <li><strong class="symbol">-</strong> — Play on it, if available.</li>
      </ol>
    </div>

    <div id="openings" class="info-card openings">
      <h3>Opening book</h3>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Sequence(s)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in openings" :key="entry.name">
            <td>{{ entry.name }}</td>
            <td class="mono">{{ entry.sequences.join(', ') || '(empty)' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="margin-top: 1.5rem; text-align: center">
      <RouterLink to="/" class="back-btn">Back to Solver</RouterLink>
    </div>
  </div>
</template>

<script setup>
import {prefixList} from '@/stores/game.js';

const openings = prefixList.map(entry => {
  const [name, sequences] = Object.entries(entry)[0];
  return {name: String(name), sequences};
});
</script>

<style scoped>
.rules-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

.rules {
  & ol {
    margin-block-start: 0.5rem;
    padding-inline-start: 1.2rem;
    color: var(--color-text-dim);
    font-size: 0.85rem;
    line-height: 1.6;
  }

  & ol li {
    margin-block-end: 0.35rem;
  }

  & .symbol {
    color: var(--color-win);
    font-family: var(--font-mono);
  }
}

.openings {
  margin-block-start: 1.5rem;

  & table {
    inline-size: 100%;
    margin-block-start: 0.5rem;
    border-collapse: collapse;
    font-size: 0.85rem;
  }

  & th,
  & td {
    padding: 6px 10px;
    border-block-end: 1px solid var(--color-border);
    text-align: start;
  }

  & th {
    color: var(--color-text);
    font-weight: 600;
  }

  & td {
    color: var(--color-text-dim);
  }

  & tr:last-child td {
    border-block-end: none;
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
