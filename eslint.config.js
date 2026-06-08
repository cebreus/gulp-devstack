import eslintComments from '@eslint-community/eslint-plugin-eslint-comments'
import prettier from 'eslint-config-prettier'
import jsdoc from 'eslint-plugin-jsdoc'
import regexp from 'eslint-plugin-regexp'
import unusedImports from 'eslint-plugin-unused-imports'
import globals from 'globals'

const CONFIG_FILE_PATTERNS = [
  '**/*.cjs',
  '**/eslint.config.*',
  '**/commitlint.config.*',
  '**/lint-staged.config.*',
  '**/plopfile.*',
  '**/.remarkrc.*',
  '**/.stylelintrc.*',
]

const TEST_FILE_PATTERNS = [
  'tests/**/*.js',
  '**/*.{spec,test}.js',
  '**/__tests__/**/*.js',
]

const PRODUCTION_FILE_PATTERNS = ['**/*.js']

export default [
  {
    ignores: [
      'node_modules/',
      'build*/',
      '.temp/',
      'dist/',
      'static/',
      'tests/.sandboxes/',
    ],
  },
  prettier,

  {
    files: PRODUCTION_FILE_PATTERNS,
    ignores: TEST_FILE_PATTERNS,
    plugins: {
      'eslint-comments': eslintComments,
      jsdoc,
      regexp,
      'unused-imports': unusedImports,
    },
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.es2024 },
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    rules: {
      'eslint-comments/no-unused-disable': 'error',
      'eslint-comments/no-unlimited-disable': 'error',
      'eslint-comments/require-description': ['error', { ignore: [] }],
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-else-return': ['error', { allowElseIf: false }],
      'no-implicit-coercion': [
        'error',
        {
          boolean: true,
          number: true,
          string: true,
          disallowTemplateShorthand: true,
        },
      ],
      'no-nested-ternary': 'error',
      'no-plusplus': 'error',
      'no-self-compare': 'error',
      'no-use-before-define': [
        'error',
        {
          functions: false,
          classes: true,
          variables: true,
        },
      ],
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'no-console': 'off',
      'max-lines': [
        'warn',
        { max: 250, skipBlankLines: true, skipComments: true },
      ],
      'max-lines-per-function': [
        'warn',
        { max: 80, skipBlankLines: true, skipComments: true },
      ],
      'max-statements': ['warn', { max: 24 }],
      'max-depth': ['warn', { max: 3 }],
      complexity: ['warn', { max: 20 }],
      'max-params': ['error', { max: 4 }],
      'max-nested-callbacks': ['error', { max: 2 }],
      ...jsdoc.configs.recommended.rules,
      ...regexp.configs.recommended.rules,
    },
  },

  {
    files: PRODUCTION_FILE_PATTERNS,
    ignores: ['tests/**/*.js'],
    plugins: {
      jsdoc,
    },
    rules: {
      'jsdoc/no-restricted-syntax': [
        'warn',
        {
          contexts: [
            {
              context:
                'FunctionDeclaration:not(ExportNamedDeclaration > FunctionDeclaration):not(ExportDefaultDeclaration > FunctionDeclaration)',
              message:
                'JSDoc should be reserved for exported functions outside tests.',
            },
            {
              context:
                'VariableDeclaration:has(> VariableDeclarator[init.type="FunctionExpression"]):not(ExportNamedDeclaration > VariableDeclaration):not(ExportDefaultDeclaration > VariableDeclaration)',
              message:
                'JSDoc should be reserved for exported functions outside tests.',
            },
            {
              context:
                'VariableDeclaration:has(> VariableDeclarator[init.type="ArrowFunctionExpression"]):not(ExportNamedDeclaration > VariableDeclaration):not(ExportDefaultDeclaration > VariableDeclaration)',
              message:
                'JSDoc should be reserved for exported functions outside tests.',
            },
          ],
        },
      ],
      'jsdoc/require-jsdoc': [
        'warn',
        {
          publicOnly: true,
          contexts: [
            'ExportNamedDeclaration > FunctionDeclaration',
            'ExportDefaultDeclaration > FunctionDeclaration',
          ],
        },
      ],
      'jsdoc/check-param-names': 'error',
      'jsdoc/require-param': 'error',
      'jsdoc/require-param-type': 'error',
      'jsdoc/require-returns': 'error',
      'jsdoc/require-returns-type': 'error',
      'jsdoc/check-types': 'error',
    },
  },

  {
    files: ['src/**/*.js'],
    languageOptions: { globals: globals.browser },
    rules: { 'no-console': 'warn' },
  },
  {
    files: TEST_FILE_PATTERNS,
    plugins: {
      jsdoc,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2024,
      },
    },
    rules: {
      'jsdoc/no-restricted-syntax': [
        'warn',
        {
          contexts: [
            {
              context: 'any',
              message: 'JSDoc is discouraged in tests.',
            },
          ],
        },
      ],
      'max-nested-callbacks': 'off',
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'max-statements': 'off',
      'max-depth': 'off',
      complexity: 'off',
      'max-params': 'off',
      'prefer-arrow-callback': 'error',
      'func-names': ['error', 'never'],
    },
  },
  {
    files: CONFIG_FILE_PATTERNS,
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2024,
      },
    },
    rules: {
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'max-statements': 'off',
      'max-depth': 'off',
      complexity: 'off',
      'max-params': 'off',
      'max-nested-callbacks': 'off',
    },
  },
]
