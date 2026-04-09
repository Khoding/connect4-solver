<template>
  <div class="loading-overlay" :class="{hidden: !game.loading}">
    <p>Loading solution data…</p>
  </div>
</template>

<script setup>
import {useGameStore} from '@/stores/game';

const game = useGameStore();
</script>

<style scoped>
.loading-overlay {
  display: grid;
  z-index: 100;
  position: fixed;
  place-items: center;
  inset: 0;
  background-color: var(--color-bg);
  font-size: 1.2rem;
  transition: opacity 0.3s;

  &.hidden {
    opacity: 0;
    pointer-events: none;
  }
}
</style>
