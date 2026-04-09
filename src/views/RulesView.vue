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
    <div style="margin-top: 1.5rem; text-align: center">
      <RouterLink to="/" class="back-btn">Back to Solver</RouterLink>
    </div>
  </div>
</template>

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
