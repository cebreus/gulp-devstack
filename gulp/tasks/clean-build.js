import { deleteAsync } from 'del'

import { getRelativePath, handleEmptyPaths } from '../utils/helpers.js'
import loggerLib from '../utils/logger.js'

const logger = loggerLib.createLogger('Clean')

/**
 * Modern async/await wrapper for deleting files and directories.
 * Cleans build or temporary artifacts with consistent logging.
 * @param {string|string[]} paths - Glob pattern or array of paths to delete
 * @returns {Promise<string[]>} List of successfully deleted paths
 * @throws {Error} If the deletion operation fails
 */
export async function cleanBuild(paths) {
  if (handleEmptyPaths(paths, 'No paths provided for cleaning')) {
    return []
  }

  logger.list('Cleaning paths', Array.isArray(paths) ? paths : [paths])
  try {
    const deletedPaths = await deleteAsync(paths, { force: true })

    if (deletedPaths.length > 0) {
      const relativePaths = deletedPaths.map((p) => getRelativePath(p))
      logger.list('Successfully deleted', relativePaths)
    } else {
      logger.verbose('Clean operation finished (nothing was deleted).')
    }

    return deletedPaths
  } catch (error) {
    logger.error('Cleanup failure:', error)
    throw new Error(`Deletion failed: ${error.message}`, { cause: error })
  }
}

export default cleanBuild
