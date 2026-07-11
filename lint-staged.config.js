export default {
  '*.js': ['eslint --fix'],
  '*.scss': ['stylelint --fix --allow-empty-input'],
  '*.md': ['remark --quiet --frail'],
  '*.njk': ['njklint --fix'],
  '*.{css,scss,js,json,njk}': ['prettier --write'],
}
