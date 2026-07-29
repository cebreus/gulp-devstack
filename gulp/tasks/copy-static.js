import { Transform } from 'node:stream'
import pc from 'picocolors'
import gulp from 'gulp'

import createChangedFilter from '../utils/changed-filter.js'
import loggerLib, {
  attachPipelineLogging,
  getRelativePath,
  isPrivateFile,
  streamToPromise,
} from '../utils/index.js'

const logger = loggerLib.createLogger('CopyStatic')

/**
 * Copies static assets from source to destination using Gulp streams.
 * Implements incremental copy using an internal changed-file filter.
 * @param {string|string[]} src - Source glob pattern(s)
 * @param {string} baseDir - Base directory for resolving relative paths
 * @param {string} dest - Destination directory
 * @returns {Promise<import('node:stream').Stream>} Gulp stream result
 */
export default function copyStatic(src, baseDir, dest) {
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
    .pipe(createChangedFilter(dest))
    .pipe(
      new Transform({
        objectMode: true,
        transform(file, _enc, cb) {
          // Skip directories entirely - let file writes create directory structure
          if (file.isDirectory()) {
            return cb(null)
          }
          if (isPrivateFile(file.path)) {
            return cb(null, null)
          }
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
