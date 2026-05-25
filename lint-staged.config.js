/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Config}
 */
export default {
  '*.js': ['eslint --fix'],
  '*.scss': ['stylelint --fix --allow-empty-input'],
  '*.md': ['remark --output --quiet --frail'],
  '*.njk': ['njklint --fix'],
  '*.{css,scss,js,json,njk}': ['prettier --write'],
}
