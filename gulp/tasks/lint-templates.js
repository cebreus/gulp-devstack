import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { glob } from 'glob'

import { isPrivateFile } from '../utils/helpers.js'
import loggerLib from '../utils/logger.js'

const execAsync = promisify(exec)
const logger = loggerLib.createLogger('Lint:NJK')

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

    // Join files into a single command, but handle potential OS command length limits
    // For a typical project, passing them as arguments is fine.
    await execAsync(`npx njklint ${filesToLint.join(' ')}`)
    // Silent on success
  } catch (error) {
    // njklint output is in error.stdout or error.stderr
    if (error.stdout) {
      console.log(error.stdout)
    }
    logger.error('Nunjucks linting failed. Please fix the errors above.')
    // We don't throw here to prevent Gulp watch from crashing
  }
}
