import { getRelativePath, handleEmptyPaths } from '../utils/helpers.js'
import logger from '../utils/logger.js'
import { deleteAsync } from 'del'

/**
 * Clean specified directories using modern async/await pattern.
 * @param {string|string[]} paths - Paths to clean.
 * @returns {Promise<string[]>} Promise resolving to array of deleted paths.
 * @throws {Error} If deletion fails, an error is thrown with details.
 */
export default async function clean(paths) {
  if (handleEmptyPaths(paths, '[Clean] Nothing to clean')) {
    return []
  }
  logger.debug(
    `[Clean] Processing: ${Array.isArray(paths) ? paths.join(', ') : paths}`
  )

  try {
    const deleted = await deleteAsync(paths, {
      force: true,
    })
    if (deleted.length > 0) {
      logger.verbose(
        `[Clean] Deleted: ${deleted.map((p) => getRelativePath(p)).join(', ')}`
      )
    } else {
      logger.verbose('[Clean] Nothing to delete.')
    }
    return deleted
  } catch (error) {
    logger.error('[Clean] Error:', error)
    throw new Error(`[Clean] Operation failed: ${error.message}`, {
      cause: error,
    })
  }
}
