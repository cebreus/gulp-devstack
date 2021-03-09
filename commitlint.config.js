module.exports = {
  rules: {
    'body-leading-blank': [1, 'always'],
    'footer-leading-blank': [1, 'always'],
    'header-max-length': [2, 'always', 60],
    'scope-case': [2, 'always', 'lower-case'],
    'subject-case': [
      2,
      'never',
      ['sentence-case', 'start-case', 'pascal-case', 'upper-case'],
    ],
    'subject-full-stop': [2, 'never', '.'],
    'type-empty': [2, 'never'],
    'type-enum': [
      2,
      'always',
      [
        'docs',
        'feat',
        'fix',
        'refactor',
        'style',
        'test',
        'chore',
        'releaseAutomat',
      ],
    ],
  },
};
