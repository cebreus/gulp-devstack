// .remarkrc.js
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkLintCode from 'remark-lint-code'
import remarkLintHeadingWhitespace from 'remark-lint-heading-whitespace'
import remarkLintNoDuplicateHeadings from 'remark-lint-no-duplicate-headings'
import remarkPresetLintConsistent from 'remark-preset-lint-consistent'
import remarkPresetLintRecommended from 'remark-preset-lint-recommended'

/** @type {import('unified').Preset} */
const config = {
  settings: {
    bullet: '-',
    listItemIndent: 'one',
    rule: '-',
    ruleSpaces: false,
    tightDefinitions: true,
  },
  plugins: [
    remarkFrontmatter,
    remarkGfm,
    remarkPresetLintRecommended,
    remarkPresetLintConsistent,
    remarkLintCode,
    remarkLintHeadingWhitespace,
  ],
  overrides: [
    {
      files: 'src/routes/**/*.md',
      plugins: [remarkLintNoDuplicateHeadings],
    },
  ],
}

export default config
