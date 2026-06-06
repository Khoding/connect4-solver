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
  <section class="not-found">
    <h1>{{ $t('not_found.title') }}</h1>
    <p>{{ $t('not_found.desc') }}</p>

    <p v-if="redirecting">
      {{ $t('not_found.redirect') }}
      <strong class="time-left">
        {{ timeLeft }}
        {{ timeLeft === 1 ? $t('not_found.second') : $t('not_found.seconds') }} </strong
      >…
    </p>

    <p class="link-home-wrapper">
      <NuxtLink :to="localePath('/')" class="link-home" @click.prevent="goHome">{{
        $t('not_found.back_to_home')
      }}</NuxtLink>
    </p>
  </section>
</template>

<script setup>
import {onMounted, onUnmounted, ref} from 'vue';

// Nuxt passes the error object to this page. We don't surface its details, but
// declaring the prop avoids an "extraneous attribute" hydration warning.
defineProps({
  error: {
    type: Object,
    default: null,
  },
});

const localePath = useLocalePath();

const timeLeft = ref(5);
const redirecting = ref(true);

let timer;

// clearError() tears down the error state and navigates home in one step.
function goHome() {
  clearError({redirect: localePath('/')});
}

onMounted(() => {
  timer = setInterval(() => {
    timeLeft.value--;

    if (timeLeft.value === 0) {
      clearInterval(timer);
      redirecting.value = false;
      goHome();
    }
  }, 1000);
});

onUnmounted(() => {
  clearInterval(timer);
});
</script>

<style scoped>
.not-found {
  text-align: center;

  h1 {
    margin-block: 2rem 1rem;
    color: var(--text);
  }
}

.time-left {
  color: var(--text);
}

.link-home-wrapper {
  margin-block-start: 2rem;
}

.link-home {
  color: var(--text);
  text-decoration: underline;

  &:hover {
    text-decoration: none;
  }
}
</style>
