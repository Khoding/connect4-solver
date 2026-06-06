import en from './locales/en.js';
import fr from './locales/fr.js';
import de from './locales/de.js';

// Eagerly bundle all three locales. They are small, and the recap exporter can
// render in any language regardless of the active UI locale, which needs every
// locale's messages available up front.
export default defineI18nConfig(() => ({
  legacy: false,
  fallbackLocale: 'en',
  messages: {en, fr, de},
}));
