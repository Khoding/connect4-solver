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

import {createI18n} from 'vue-i18n';
import en from './en.js';
import fr from './fr.js';
import de from './de.js';

const messages = {
  en,
  fr,
  de,
};

// Check localStorage or browser settings to determine the initial locale
function getInitialLocale() {
  try {
    const saved = localStorage.getItem('c4_locale');
    if (saved && ['en', 'fr', 'de'].includes(saved)) {
      return saved;
    }
  } catch {
    /* localStorage not available */
  }

  const browserLang = navigator.language || navigator.userLanguage;
  if (browserLang) {
    const prefix = browserLang.substring(0, 2).toLowerCase();
    if (['en', 'fr', 'de'].includes(prefix)) {
      return prefix;
    }
  }

  return 'en';
}

const i18n = createI18n({
  legacy: false, // Set to false to support Composition API & Setup
  locale: getInitialLocale(),
  fallbackLocale: 'en',
  messages,
});

export default i18n;
