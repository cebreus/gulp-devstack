import path from 'node:path'
import { deleteAsync } from 'del'

import loggerLib, { getRelativePath, handleEmptyPaths } from '../utils/index.js'

const logger = loggerLib.createLogger('Clean')

function assertWithinRoot(target, root) {
  const relative = path.relative(root, path.resolve(target))
  if (
    !relative ||
    relative === '..' ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`Path is outside the allowed root: ${target}`)
  }
}

function assertPathsWithinRoot(paths, allowedRoot) {
  const root = path.resolve(allowedRoot)

  for (const target of Array.isArray(paths) ? paths : [paths]) {
    assertWithinRoot(target, root)
  }
}

async function resolveValidatedTargets(paths, allowedRoot) {
  const root = path.resolve(allowedRoot)
  const expandedPaths = await deleteAsync(paths, { dryRun: true, force: true })

  for (const target of expandedPaths) {
    assertWithinRoot(target, root)
  }

  return expandedPaths
}

/**
 * Modern async/await wrapper for deleting files and directories.
 * Cleans build or temporary artifacts with consistent logging.
 * @param {string|string[]} paths - Glob pattern or array of paths to delete
 * @param {string} [allowedRoot] - Root containing deletable paths
 * @returns {Promise<string[]>} List of successfully deleted paths
 * @throws {Error} If the deletion operation fails
 */
export default async function cleanBuild(paths, allowedRoot = process.cwd()) {
  if (handleEmptyPaths(paths, 'No paths provided for cleaning')) {
    return []
  }

  logger.list('Cleaning paths', Array.isArray(paths) ? paths : [paths])
  try {
    assertPathsWithinRoot(paths, allowedRoot)
    const validatedTargets = await resolveValidatedTargets(paths, allowedRoot)
    const deletedPaths = validatedTargets.length
      ? await deleteAsync(validatedTargets, { force: true })
      : []

    if (deletedPaths.length > 0) {
      const relativePaths = deletedPaths.map((p) => getRelativePath(p))
      logger.list('Successfully deleted', relativePaths)
    } else {
      logger.verbose('Clean operation finished (nothing was deleted).')
    }

    return deletedPaths
  } catch (error) {
    logger.error(`Cleanup failure. Cause: ${error.message}`)
    throw new Error(`Deletion failed: ${error.message}`, { cause: error })
  }
}
