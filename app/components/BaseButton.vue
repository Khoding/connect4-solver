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

<template>
  <NuxtLinkLocale
    v-if="to"
    :to="to"
    class="base-button-wrapper"
    :class="[variantClass]"
    :disabled="disabled"
  >
    <slot name="icon" />
    <span v-if="$slots.default" class="base-button-label"><slot /></span>
  </NuxtLinkLocale>
  <button
    v-else
    type="button"
    class="base-button-wrapper"
    :class="[variantClass]"
    :disabled="disabled"
  >
    <slot name="icon" />
    <span v-if="$slots.default" class="base-button-label"><slot /></span>
  </button>
</template>

<script setup>
import {computed} from 'vue';

const props = defineProps({
  to: {
    type: [String, Object],
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  variant: {
    type: String,
    default: 'default', // 'default', 'reset', 'replay', 'replay-active', 'danger', 'accent'
  },
});

const variantClass = computed(() => {
  return `variant-${props.variant}`;
});
</script>

<style scoped>
.base-button-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  gap: 0.4rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
  color: var(--color-text);
  font-size: 0.9rem;
  line-height: 1;
  font-family: inherit;
  text-decoration: none;
  cursor: pointer;
  transition:
    background-color 0.15s,
    border-color 0.15s,
    color 0.15s;

  &:hover:not(:disabled) {
    background-color: var(--color-surface-alt);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.3;
  }
}

.base-button-wrapper :deep(svg) {
  display: block;
  flex-shrink: 0;
  width: 1.2em;
  height: 1.2em;
}

.base-button-label {
  display: block;
  margin-block-start: -0.1em;
}

/*
  Trim the label's line box to its cap-height/alphabetic-baseline so the text
  centers on its real glyph bounds, not on font-dependent ascent/descent.
  This neutralises the desktop-font vs Android-Roboto vertical offset next to
  the icon. Browsers without support fall back to `align-items: center`.
*/
@supports (text-box: trim-both cap alphabetic) {
  .base-button-label {
    text-box: trim-both cap alphabetic;
  }
}

.variant-reset {
  border-color: color-mix(in oklch, var(--color-border), oklch(0.65 0.2 25) 30%);
  color: oklch(0.65 0.2 25);

  &:hover:not(:disabled) {
    border-color: oklch(0.65 0.2 25);
    background-color: oklch(0.65 0.2 25 / 0.1);
    color: oklch(0.7 0.22 25);
  }
}

.variant-replay {
  border-color: color-mix(in oklch, var(--color-border), var(--color-accent) 30%);
  color: var(--color-accent);

  &:hover:not(:disabled) {
    border-color: var(--color-accent);
    background-color: color-mix(in oklch, var(--color-accent), transparent 90%);
  }
}

.variant-replay-active {
  border-color: var(--color-accent);
  background-color: var(--color-accent);
  color: var(--color-bg);

  &:hover:not(:disabled) {
    background-color: color-mix(in oklch, var(--color-accent), black 15%);
  }
}

.variant-confirm {
  border-color: oklch(0.6 0.22 25);
  background-color: oklch(0.45 0.2 25);
  color: white;

  &:hover:not(:disabled) {
    background-color: oklch(0.5 0.22 25);
  }
}

.variant-danger {
  border-color: color-mix(in oklch, var(--color-border), oklch(0.65 0.2 25) 30%);
  color: oklch(0.65 0.2 25);

  &:hover:not(:disabled) {
    border-color: oklch(0.65 0.2 25);
    background-color: oklch(0.65 0.2 25 / 0.1);
  }
}

.variant-accent {
  border-color: color-mix(in oklch, var(--color-border), var(--color-accent) 40%);
  color: var(--color-accent);

  &:hover:not(:disabled) {
    border-color: var(--color-accent);
    background-color: color-mix(in oklch, var(--color-accent), transparent 90%);
  }
}

.variant-win {
  &:hover:not(:disabled) {
    border-color: var(--color-accent);
    background-color: var(--color-surface-alt);
    color: var(--color-win);
  }
}
</style>
