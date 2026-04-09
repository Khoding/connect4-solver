<template>
  <div class="side-menu-overlay" :class="{active: open}" @click="emit('close')"></div>
  <div class="side-menu" :class="{active: open}">
    <div class="side-menu-header">
      <h2>How to read the steady-state</h2>
      <button class="close-btn" @click="emit('close')">&times;</button>
    </div>
    <SteadyStateRules />
  </div>
</template>

<script setup>
defineProps({
  open: Boolean,
});

const emit = defineEmits(['close']);
import SteadyStateRules from '@/components/SteadyStateRules.vue';
</script>

<style scoped>
.side-menu-overlay {
  display: block;
  z-index: 40;
  position: fixed;
  inset: 0;
  background-color: oklch(0 0 0 / 0.5);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;

  &.active {
    opacity: 1;
    pointer-events: auto;
  }
}

.side-menu {
  display: flex;
  z-index: 50;
  position: fixed;
  top: 0;
  right: -100%;
  bottom: 0;
  flex-direction: column;
  width: 85vw;
  max-width: 400px;
  padding: 1.5rem;
  overflow-y: auto;
  border-left: 1px solid var(--color-border);
  background-color: var(--color-bg);
  box-shadow: -4px 0 16px oklch(0 0 0 / 0.4);
  transition: right 0.3s ease;

  &.active {
    right: 0;
  }
}

.side-menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;

  & h2 {
    font-size: 1.2rem;
  }
}

.close-btn {
  border: none;
  background: none;
  color: var(--color-text);
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
}
</style>
