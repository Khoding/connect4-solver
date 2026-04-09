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
