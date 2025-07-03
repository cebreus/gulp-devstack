export default {
  plugins: [
    'stylelint-high-performance-animation',
    'stylelint-selector-bem-pattern',
  ],
  extends: [
    'stylelint-config-standard-scss',
    '@visionappscz/stylelint-config',
    '@visionappscz/stylelint-config/order',
    '@visionappscz/stylelint-config/scss',
    'stylelint-config-prettier-scss',
  ],
  customSyntax: 'postcss-scss',
  rules: {
    'unit-allowed-list': [
      'px',
      'rem',
      'em',
      '%',
      's',
      'deg',
      'vh',
      'vw',
      'dvw',
      'ch',
      'fr',
      'ms',
    ],
    'plugin/no-low-performance-animation-properties': true,
    'plugin/selector-bem-pattern': {
      preset: 'bem',
      implicitComponents: '**/c-*.scss',
      componentName: '(([a-z0-9]+(?!-$)-?)+)',
      componentSelectors: {
        initial:
          "\\.{componentName}(((__|--)(([a-z0-9\\[\\]'=]+(?!-$)-?)+))+)?$",
      },
      implicitUtilities: '**/u-*.scss',
      utilitySelectors: '^\\.u-[a-z]+$',
    },
    // Reset for visionapps
    'selector-nested-pattern': null,
    'selector-class-pattern': null,
    'order/order': [
      'dollar-variables',
      'custom-properties',
      { name: 'extend', type: 'at-rule' },
      'declarations',
      { name: 'include', type: 'at-rule' },
      'rules',
    ],
  },
  ignoreFiles: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
}
