/*
 * Copyright (C) Pascal Pons (https://github.com/PascalPons/connect4)
 * Copyright (C) 2026 Khodok
 *
 * This file is part of Connect4 Game Solver.
 *
 * Connect4 Game Solver is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * Connect4 Game Solver is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Connect4 Game Solver. If not, see <http://www.gnu.org/licenses/>.
 */

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
