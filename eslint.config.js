// @nuxt/eslint generates .nuxt/eslint.config.mjs (Vue + JS recommended rules and
// all Nuxt auto-import globals) during `nuxt prepare`. We extend it and keep the
// existing oxlint hand-off + Prettier formatting opt-out.
import withNuxt from './.nuxt/eslint.config.mjs';
import pluginOxlint from 'eslint-plugin-oxlint';
import skipFormatting from 'eslint-config-prettier/flat';

export default withNuxt(
  {
    name: 'app/ignores',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**', '**/.output/**', '**/public/wasm/**'],
  },

  {
    rules: {
      'vue/no-multiple-template-root': 'off',
    },
  },

  // Let oxlint own the rules it already covers, then drop formatting rules.
  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  skipFormatting,
);
