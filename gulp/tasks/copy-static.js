import { Transform } from 'node:stream'
import gulpNewer from 'gulp-newer'
import pc from 'picocolors'
import gulp from 'gulp'

import {
  attachPipelineLogging,
  getRelativePath,
  streamToPromise,
} from '../utils/helpers.js'
import loggerLib from '../utils/logger.js'

const logger = loggerLib.createLogger('Copy')

/**
 * Copies static assets from source to destination using Gulp streams.
 * Implements incremental copy using the 'gulp-newer' plugin.
 * @param {string|string[]} src - Source glob pattern(s)
 * @param {string} baseDir - Base directory for resolving relative paths
 * @param {string} dest - Destination directory
 * @returns {Promise<import('node:stream').Readable>} Gulp stream result
 */
export async function copyStatic(src, baseDir, dest) {
  logger.list(
    `Starting copy to ${pc.cyan(dest)} (base: ${pc.dim(baseDir)})`,
    Array.isArray(src) ? src : [src]
  )

  const processedFiles = []

  const copyPipeline = gulp
    .src(src, {
      base: baseDir,
      allowEmpty: true,
      dot: true,
    })
    .pipe(gulpNewer(dest))
    .pipe(
      new Transform({
        objectMode: true,
        transform(file, _enc, cb) {
          if (file.path) {
            processedFiles.push(getRelativePath(file.path))
          }
          cb(null, file)
        },
      })
    )
    .pipe(gulp.dest(dest))

  attachPipelineLogging({
    stream: copyPipeline,
    loggerInstance: logger,
    trackedFiles: processedFiles,
    successLabel: 'Copied assets',
    emptyMessage: 'No newer static files found to copy.',
    errorMessage: 'Copy task failure:',
  })

  return streamToPromise(copyPipeline)
}

export default copyStatic
