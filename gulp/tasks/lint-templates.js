import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { glob } from 'glob'

import loggerLib, { isPrivateFile } from '../utils/index.js'

const execAsync = promisify(exec)
const logger = loggerLib.createLogger('LintTemplates')

/**
 * Task: Lints Nunjucks templates using njklint.
 * Filters out private files/directories starting with _ or __.
 * @returns {Promise<void>}
 */
export default async function lintTemplates() {
  try {
    const pattern = 'src/**/*.{njk,md}'
    const allFiles = await glob(pattern)
    const filesToLint = allFiles.filter((f) => !isPrivateFile(f))

    if (filesToLint.length === 0) {
      logger.verbose('No templates found to lint.')
      return
    }

    await execAsync(`npx njklint ${filesToLint.join(' ')}`)
  } catch (error) {
    if (error.stdout) {
      console.log(error.stdout)
    }
    logger.error(
      `Nunjucks linting failed. Review output above and run \`npx njklint src/**/*.{njk,md}\` locally to inspect details. Cause: ${error.message}`
    )
    // We don't throw here to prevent Gulp watch from crashing
  }
}
