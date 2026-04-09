<template>
  <div class="rules-container">
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
      <p>Made for personal use.</p>
    </div>

    <div style="margin-block-start: 1.5rem; text-align: center">
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
