import {createApp} from 'vue';
import {createPinia} from 'pinia';

import App from '@/App.vue';
import router from '@/router';
import '@/assets/style.css';

const app = createApp(App);

router.isReady().then(async () => {
  const redirectUrl = localStorage.getItem('redirectUrl');
  if (redirectUrl) {
    localStorage.removeItem('redirectUrl');
    await router.replace(redirectUrl);
  }
  app.mount('#app');
});

app.use(createPinia());
app.use(router);
