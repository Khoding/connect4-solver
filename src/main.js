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
import i18n from '@/i18n';
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
app.use(i18n);
app.use(router);

// --- DEBUGGER LOGIC START ---
(() => {
  const loadDebugger = async () => {
    // 1. Load Eruda
    const [eruda] = await Promise.all([import(/* @vite-ignore */ 'https://esm.sh/eruda')]);
    eruda.default.init();

    // 2. INJECT STYLES INTO SHADOW DOM
    const erudaContainer = document.getElementById('eruda');
    if (erudaContainer && erudaContainer.shadowRoot) {
      const style = document.createElement('style');
      style.innerHTML = `
        .eruda-dev-tools .eruda-resizer {
          block-size: 25px !important;
          background: rgb(255 255 255 / 0.1) !important;
          transform: translateY(-18px) !important;
        }
      `;
      erudaContainer.shadowRoot.appendChild(style);
    }

    console.log('🐞 Eruda Loaded');
  };

  // 3. Activation Check
  if (
    new URLSearchParams(window.location.search).has('debug') ||
    localStorage.getItem('debug_mode')
  ) {
    localStorage.setItem('debug_mode', 'true');
    loadDebugger();
  }

  // 4. Secret Gesture: 50 taps logic
  let tapCount = 0;
  let tapTimer = null;

  window.addEventListener('touchstart', () => {
    tapCount++;
    clearTimeout(tapTimer);
    tapTimer = setTimeout(() => {
      tapCount = 0;
    }, 500);

    if (tapCount >= 50) {
      if (localStorage.getItem('debug_mode')) {
        localStorage.removeItem('debug_mode');
        alert('Debugger Disabled');
      } else {
        localStorage.setItem('debug_mode', 'true');
        alert('Debugger Enabled');
      }
      window.location.reload();
    }
  });
})();
// --- DEBUGGER LOGIC END ---
