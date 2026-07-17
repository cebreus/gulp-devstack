export default {
  '*.{js,mjs,cjs}': ['eslint --fix', 'prettier --write'],
  '*.scss': ['stylelint --fix --allow-empty-input', 'prettier --write'],
  '*.md': ['remark --quiet --frail'],
  '*.njk': ['njklint --fix', 'prettier --write'],
  '*.hbs': ['prettier --write'],
  '*.{css,json}': ['prettier --write'],
}
