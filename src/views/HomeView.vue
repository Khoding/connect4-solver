<template>
  <header class="header">
    <h1>Connect 4 <span class="subtitle">Weak Solution Explorer</span></h1>
    <p class="tagline">Pick your color and turn order, then follow the solver's suggestions.</p>
  </header>

  <main class="main">
    <BoardArea @open-rules="rulesOpen = true" />
    <InfoPanel />
  </main>

  <LoadingOverlay />
  <SideMenu :open="rulesOpen" @close="rulesOpen = false" />
</template>

<script setup>
import {onMounted, onUnmounted, ref} from 'vue';
import {useGameStore} from '@/stores/game';
import BoardArea from '@/components/BoardArea.vue';
import InfoPanel from '@/components/InfoPanel.vue';
import SideMenu from '@/components/SideMenu.vue';
import LoadingOverlay from '@/components/LoadingOverlay.vue';

const game = useGameStore();
const rulesOpen = ref(false);

onMounted(() => {
  game.init();
  window.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
});

function onKeydown(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  const key = e.key.toLowerCase();
  if (key === 'arrowleft' || key === 'u') game.stepBack();
  if (key === 'arrowright') game.stepForward();
  if (key === 'r') game.resetBoard();
  if (key >= '1' && key <= '7') game.makeMove(parseInt(key));
}
</script>

<style scoped>
.header {
  margin-block-end: 2rem;
  text-align: center;

  & h1 {
    font-weight: 700;
    font-size: clamp(1.4rem, 3vw, 2rem);
    letter-spacing: -0.02em;
  }
}

.subtitle {
  color: var(--color-text-dim);
  font-weight: 400;
}

.tagline {
  margin-block-start: 0.25rem;
  color: var(--color-text-dim);
  font-size: clamp(0.85rem, 1.8vw, 1rem);
}

.main {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: center;
  gap: 2rem;
}

@media (max-width: 720px) {
  .main {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
}

@media (min-width: 721px) and (max-width: 1100px) {
  .main {
    justify-content: center;
  }
}
</style>
