import remarkLintNoDuplicateHeadings from 'remark-lint-no-duplicate-headings'

import config from '../../.remarkrc.js'

export default {
  ...config,
  plugins: [...config.plugins, remarkLintNoDuplicateHeadings],
}
