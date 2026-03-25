import { FlatCompat } from '@eslint/eslintrc'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

const compat = new FlatCompat()

export default [
  prettier,
  ...compat.config({
    plugins: ['jsdoc', 'regexp'],
    extends: ['plugin:jsdoc/recommended', 'plugin:regexp/recommended'],
  }),

  // Node.js files (root, gulp, config files)
  {
    files: [
      'gulpfile*.js',
      'gulp/**/*.js',
      '*.config.js',
      '.eslintrc.js',
      'babel.config.js',
    ],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2024,
      },
    },
    plugins: {},
    rules: {
      'jsdoc/require-jsdoc': 'warn',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },

  // Browser files (src directory)
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2024,
      },
    },
    rules: {
      'jsdoc/require-jsdoc': 'warn',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
    },
  },

  // Test files
  {
    files: ['**/*.test.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        describe: 'readonly',
        it: 'readonly',
        before: 'readonly',
        after: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
    rules: {
      'jsdoc/require-jsdoc': 'off',
      'no-console': 'off',
    },
  },

  {
    ignores: ['node_modules/', 'build*/', '.temp/', 'dist/', 'static/'],
  },
]
