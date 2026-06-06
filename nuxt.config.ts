import browserslist from 'browserslist';
import {browserslistToTargets} from 'lightningcss';

// Browsers we transpile/polyfill CSS for. Covers older Android Chrome so
// modern features (nesting, oklch, color-mix, logical properties) get fallbacks.
const cssTargets = browserslistToTargets(browserslist('>= 0.5%, last 4 versions, not dead'));

// Deny-list pattern: anything that looks like a static asset (has an extension)
// should not fall back to the SPA shell in the service worker.
const staticAssetPathPattern = /\/[^/?]+\.[^/?]+(?:\?.*)?$/;

const SITE_URL = 'https://www.connect4-solver.com';
const DESCRIPTION =
  'Play Connect 4 against a perfect mathematical solver. Analyze moves, find optimal strategies, and review game recaps. Powered by WebAssembly.';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-06-06',
  ssr: true,

  modules: [
    '@nuxt/eslint',
    '@pinia/nuxt',
    '@nuxtjs/i18n',
    '@vite-pwa/nuxt',
    '@nuxtjs/sitemap',
    '@nuxtjs/robots',
  ],

  css: ['~/assets/style.css'],

  app: {
    baseURL: '/',
    head: {
      title: 'Connect 4 Solver',
      meta: [
        {charset: 'UTF-8'},
        {name: 'viewport', content: 'width=device-width, initial-scale=1.0'},
        {name: 'theme-color', content: '#1a1a2e'},
        {name: 'description', content: DESCRIPTION},
      ],
      link: [
        {rel: 'icon', href: '/icon.svg', type: 'image/svg+xml'},
        {rel: 'apple-touch-icon', href: '/icon.svg'},
      ],
      script: [
        {
          innerHTML: `(function() {
            try {
              var raw = localStorage.getItem('c4_state');
              if (raw) {
                var state = JSON.parse(raw);
                var docEl = document.documentElement;
                if (state.hideHeader) docEl.classList.add('hide-header-preset');
                if (state.hideFooter) docEl.classList.add('hide-footer-preset');
                if (state.hideMoveSequence) docEl.classList.add('hide-move-sequence-preset');
                if (state.hideNavigation) docEl.classList.add('hide-navigation-preset');
                if (state.hideReplay) docEl.classList.add('hide-replay-preset');
                if (state.hideExportImport) docEl.classList.add('hide-export-import-preset');
                if (state.hideColors) docEl.classList.add('hide-colors-preset');
                if (state.hideSolverStatus) docEl.classList.add('hide-solver-status-preset');
                if (state.hideAutoplay) docEl.classList.add('hide-autoplay-preset');
                if (state.hideEvalBar) docEl.classList.add('hide-eval-bar-preset');
                if (state.hideScoreBar) docEl.classList.add('hide-score-bar-preset');
                if (state.hideColumnHelp) docEl.classList.add('hide-column-help-preset');
                if (state.hideLangSelector) docEl.classList.add('hide-lang-selector-preset');
                if (state.hideLearn) docEl.classList.add('hide-learn-preset');
                if (state.hideSteadyState) docEl.classList.add('hide-steady-state-preset');
              }
            } catch (e) {}
          })();`,
          type: 'text/javascript',
        },
      ],
    },
  },

  // Shared base URL for sitemap / robots / canonical + hreflang generation.
  site: {url: SITE_URL, name: 'Connect 4 Solver'},

  i18n: {
    strategy: 'prefix_except_default',
    defaultLocale: 'en',
    langDir: 'locales',
    locales: [
      {code: 'en', language: 'en-US', name: 'English', file: 'en.js'},
      {code: 'fr', language: 'fr-FR', name: 'Français', file: 'fr.js'},
      {code: 'de', language: 'de-DE', name: 'Deutsch', file: 'de.js'},
    ],
    // Eager, bundled messages (small) so recap export-in-any-language works
    // without lazy-loading round-trips. See i18n/i18n.config.ts.
    vueI18n: './i18n.config.ts',
    baseUrl: SITE_URL,
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'c4_locale',
      redirectOn: 'root',
      alwaysRedirect: false,
    },
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/', '/fr', '/de', '/settings', '/fr/settings', '/de/settings', '/sitemap.xml'],
    },
  },

  pwa: {
    registerType: 'autoUpdate',
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,ico,wasm}'],
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      navigateFallback: '/',
      cleanupOutdatedCaches: true,
      navigateFallbackDenylist: [staticAssetPathPattern],
      skipWaiting: true,
      clientsClaim: true,
      runtimeCaching: [
        {
          urlPattern: /\/wasm\/7x6\.book$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'opening-book',
            expiration: {
              maxEntries: 1,
              maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
      ],
    },
    manifest: {
      name: 'Connect 4 Solver',
      short_name: 'Connect 4 Solver',
      description: 'A perfect Connect 4 solver running locally in your browser via WebAssembly.',
      start_url: '/',
      display: 'standalone',
      background_color: '#1a1a2e',
      theme_color: '#1a1a2e',
      icons: [
        {
          src: 'icon.svg',
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'any',
        },
      ],
    },
  },

  vite: {
    css: {
      transformer: 'lightningcss',
      lightningcss: {
        targets: cssTargets,
      },
    },
    build: {
      cssMinify: 'lightningcss',
    },
  },
});
