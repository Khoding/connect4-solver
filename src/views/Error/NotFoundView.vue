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
    <h1>404 — Page not found</h1>
    <p>The page you're looking for doesn't exist.</p>

    <p v-if="redirecting">
      Redirecting in
      <strong class="time-left">
        {{ timeLeft }}
        {{ timeLeft === 1 ? 'second' : 'seconds' }} </strong
      >…
    </p>

    <p class="link-home-wrapper">
      <RouterLink to="/" class="link-home">Back to home</RouterLink>
    </p>
  </section>
</template>

<script setup>
import {onMounted, onUnmounted, ref} from 'vue';
import {useRouter} from 'vue-router';

const router = useRouter();

const timeLeft = ref(5);
const redirecting = ref(true);

let timer;

onMounted(() => {
  timer = setInterval(() => {
    timeLeft.value--;

    if (timeLeft.value === 0) {
      clearInterval(timer);
      redirecting.value = false;
      router.push('/');
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
