import en from './locales/en.js';
import fr from './locales/fr.js';
import de from './locales/de.js';
// Addressed through the project-root alias, not a relative path: @nuxtjs/i18n
// rewrites the relative imports in this config file against its own base, which
// resolves anything it was not told about in nuxt.config to the wrong place.
import guideEn from '~~/i18n/guide/en.js';
import guideFr from '~~/i18n/guide/fr.js';
import guideDe from '~~/i18n/guide/de.js';

// Eagerly bundle all three locales. They are small, and the recap exporter can
// render in any language regardless of the active UI locale, which needs every
// locale's messages available up front.
// The /guide essay is long and structured, so it lives in its own file per
// locale (see guide-en.js for the block vocabulary) and is merged in under the
// `guide` key rather than bloating the UI-string files.
export default defineI18nConfig(() => ({
  legacy: false,
  fallbackLocale: 'en',
  // The guide's prose carries inline <strong>/<em>/<a>, which the template
  // renders with v-html. It is authored in this repository, never user input.
  warnHtmlMessage: false,
  messages: {
    en: {...en, guide: guideEn},
    fr: {...fr, guide: guideFr},
    de: {...de, guide: guideDe},
  },
}));
