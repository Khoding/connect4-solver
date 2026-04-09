<template>
  <ol class="rules-list">
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
      <strong>even row</strong> (2, 4, 6 from bottom).
    </li>
    <li><strong class="symbol">+</strong> — Play on it, if available.</li>
    <li><strong class="symbol">=</strong> — Play on it, if available.</li>
    <li><strong class="symbol">-</strong> — Play on it, if available.</li>
  </ol>
  <RouterLink v-if="showLink" to="/rules">Rules page</RouterLink>
</template>

<script setup>
defineProps({
  showLink: {
    type: Boolean,
    default: true,
  },
});
</script>

<style scoped>
.rules-list {
  margin-block-start: 0.5rem;
  padding-inline-start: 1.2rem;
  color: var(--color-text-dim);
  font-size: 0.85rem;
  line-height: 1.6;

  & li {
    margin-block-end: 0.35rem;
  }

  & .symbol {
    color: var(--color-win);
    font-family: var(--font-mono);
  }
}
</style>
