import { FlatCompat } from '@eslint/eslintrc'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

const compat = new FlatCompat()

export default [
  {
    ignores: ['node_modules/', 'build*/', '.temp/', 'dist/', 'static/'],
  },
  prettier,

  // 1. Plugins recommended settings (Scoped to exclude tests)
  ...compat
    .config({
      plugins: ['jsdoc', 'regexp'],
      extends: ['plugin:jsdoc/recommended', 'plugin:regexp/recommended'],
    })
    .map((config) => ({
      ...config,
      ignores: ['tests/**/*.js'],
    })),

  // 2. Base Configuration (Global)
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.es2024 },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },

  // 3. JSDoc Strict Enforcement (Non-test files)
  {
    files: ['**/*.js'],
    ignores: ['tests/**/*.js'],
    rules: {
      'jsdoc/require-jsdoc': 'warn',
      'jsdoc/check-param-names': 'error',
      'jsdoc/require-param': 'error',
      'jsdoc/require-param-type': 'error',
      'jsdoc/require-returns': 'error',
      'jsdoc/require-returns-type': 'error',
      'jsdoc/check-types': 'error',
    },
  },

  // 4. Environment Specific Overrides
  {
    files: ['src/**/*.js'],
    languageOptions: { globals: globals.browser },
    rules: { 'no-console': 'warn' },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        before: 'readonly',
        after: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
  },
]
