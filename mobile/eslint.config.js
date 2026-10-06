// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  expoConfig,
  // Prettier gira a parte: qui spegne solo le regole di stile in conflitto
  prettierConfig,
  { ignores: ['dist/*', 'uniwind-types.d.ts'] },
]);
