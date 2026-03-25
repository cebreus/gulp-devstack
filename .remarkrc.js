// .remarkrc.js
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkLintCode from 'remark-lint-code'
import remarkLintHeadingWhitespace from 'remark-lint-heading-whitespace'
import remarkLintMatchPunctuation from 'remark-lint-match-punctuation'
import remarkLintNoDuplicateHeadings from 'remark-lint-no-duplicate-headings'
import remarkPresetLintConsistent from 'remark-preset-lint-consistent'
import remarkPresetLintRecommended from 'remark-preset-lint-recommended'

/** @type {import('unified').Preset} */
const config = {
  plugins: [
    remarkFrontmatter,
    remarkGfm,
    remarkPresetLintRecommended,
    remarkPresetLintConsistent,
    remarkLintCode,
    remarkLintHeadingWhitespace,
    remarkLintMatchPunctuation,
  ],
  overrides: [
    {
      files: 'src/routes/**/*.md',
      plugins: [remarkLintNoDuplicateHeadings],
    },
  ],
}

export default config
