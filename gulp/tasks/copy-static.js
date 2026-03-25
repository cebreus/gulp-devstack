import gulp from 'gulp'

import { getRelativePath } from '../utils/helpers.js'
import logger from '../utils/logger.js'
import pc from 'picocolors'
import through2 from 'through2'

/**
 * Copies static files from source to destination using Gulp streams.
 * Uses async/await for testability and modern error handling.
 * @param {string|string[]} src - Source paths (glob or array)
 * @param {string} baseDir - Base directory to resolve relative paths from
 * @param {string} dest - Destination directory
 * @returns {Promise<void>} Resolves when copy is complete
 */
export default async function copyStatic(src, baseDir, dest) {
  logger.debug(`[Copy] From ${src} to ${dest}`)
  const copiedFiles = []
  return new Promise((resolve, reject) => {
    gulp
      .src(src, {
        base: baseDir,
        allowEmpty: true,
      })
      .pipe(
        through2.obj(function (file, enc, cb2) {
          if (file.path) {
            const relPath = getRelativePath(file.path)
            copiedFiles.push(relPath)
          }
          cb2(null, file)
        })
      )
      .pipe(gulp.dest(dest))
      .on('end', () => {
        if (copiedFiles.length > 0) {
          logger.verbose(
            `[Copy] Processed:\n` +
              copiedFiles.map((f) => `            - ${pc.yellow(f)}`).join('\n')
          )
        } else {
          logger.verbose('[Copy] No files processed.')
        }
        resolve()
      })
      .on('error', (err) => {
        logger.error('[Copy] Error:', err)
        reject(err)
      })
  })
}
