export default {
  env: {
    node: true,
    es2022: true,
    browser: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // Error prevention
    'no-var': 'error',
    'prefer-const': 'error',
    'no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      destructuredArrayIgnorePattern: '^_'
    }],
    'no-console': ['warn', {
      allow: ['warn', 'error']
    }],

    // Code style
    'indent': ['error', 2],
    'quotes': ['error', 'single', {
      avoidEscape: true
    }],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'always-multiline'],

    // Modern JS features
    'arrow-body-style': ['error', 'as-needed'],
    'object-shorthand': ['error', 'always'],
    'prefer-template': 'error',
    'prefer-destructuring': ['error', {
      array: false,
      object: true
    }],

    // Spacing
    'array-bracket-spacing': ['error', 'never'],
    'object-curly-spacing': ['error', 'always'],
    'comma-spacing': ['error', {
      before: false,
      after: true
    }],
    'eol-last': ['error', 'always'],
    'no-multiple-empty-lines': ['error', {
      max: 1,
      maxEOF: 1
    }],
  }
};
