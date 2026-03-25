const config = {
  arrowParens: 'always',
  bracketSameLine: false,
  bracketSpacing: true,
  endOfLine: 'lf',
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  useTabs: false,
  importOrder: [
    '<THIRD_PARTY_MODULES>',
    '^gulp$',
    '^./gulpconfig',
    '',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  plugins: [
    '@trivago/prettier-plugin-sort-imports',
    'prettier-plugin-jinja-template',
  ],
  overrides: [
    {
      files: '*.njk',
      options: {
        parser: 'jinja-template',
        printWidth: 120,
        htmlWhitespaceSensitivity: 'strict',
      },
    },
    {
      files: '*.js',
      options: {
        printWidth: 80,
        singleQuote: true,
        arrowParens: 'always',
      },
    },
    {
      files: '*.json',
      options: {
        useTabs: true,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always',
      },
    },
  ],
}

export default config
