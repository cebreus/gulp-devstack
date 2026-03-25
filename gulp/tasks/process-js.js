import gulp from 'gulp'

import * as config from '../config.js'
import { getRelativePath } from '../utils/helpers.js'
import logger from '../utils/logger.js'
import babel from 'gulp-babel'
import concat from 'gulp-concat'
import plumber from 'gulp-plumber'
import sourcemaps from 'gulp-sourcemaps'
import pc from 'picocolors'

/**
 * Processes JavaScript files with Babel, optional concatenation, and source maps.
 * Always uses async/await and returns a Promise that resolves when processing is complete.
 * @param {string[]|string} filePaths - Source JS file(s) to process.
 * @param {string} outputDir - Output directory for processed JS files.
 * @param {object} options - Processing options.
 * @param {boolean} [options.concatFiles] - Whether to concatenate all files.
 * @param {string} [options.outputConcatPrefixFileName] - Prefix for concatenated file.
 * @param {boolean} [options.sourceMaps] - Override source maps setting.
 * @returns {Promise<void>} Resolves when processing is complete.
 */
export default async function processJs(filePaths, outputDir, options = {}) {
  const {
    concatFiles = false,
    outputConcatPrefixFileName = 'app',
    sourceMaps,
  } = options

  const createSourceMaps = sourceMaps ?? config.sourceMaps()

  // Simple filePaths validation
  const isArray = Array.isArray(filePaths)
  if (
    !filePaths ||
    (isArray && filePaths.length === 0) ||
    (!isArray && typeof filePaths !== 'string') ||
    (typeof filePaths === 'string' && filePaths.trim() === '')
  ) {
    logger.warn(
      '[JavaScript] No valid input files provided to processJs. Skipping processing.'
    )
    return
  }

  logger.debug(
    `[JavaScript] Processing from ${filePaths} to ${outputDir} with options: concatFiles=${concatFiles}, sourceMaps=${createSourceMaps}`
  )

  return new Promise((resolve, reject) => {
    let stream = gulp.src(filePaths).pipe(plumber())
    if (createSourceMaps) stream = stream.pipe(sourcemaps.init())
    stream = stream.pipe(babel())
    if (concatFiles) {
      logger.debug(
        `[JavaScript] Concatenating to ${outputConcatPrefixFileName}.js`
      )
      stream = stream.pipe(concat(`${outputConcatPrefixFileName}.js`))
    }
    if (createSourceMaps) stream = stream.pipe(sourcemaps.write('.'))

    const writtenFiles = []
    const destStream = stream.pipe(gulp.dest(outputDir))

    destStream.on('data', (file) => {
      if (file && typeof file.path === 'string') {
        try {
          writtenFiles.push(getRelativePath(file.path))
        } catch {
          logger.warn(
            `[JavaScript] Could not get relative path for file: ${file.path}`
          )
        }
      }
    })
    destStream.on('finish', () => {
      if (writtenFiles.length > 0) {
        logger.verbose(
          `[JavaScript] Written files:\n` +
            writtenFiles.map((f) => `            - ${pc.yellow(f)}`).join('\n')
        )
      } else {
        logger.verbose(
          `[JavaScript] No files written to: ${getRelativePath(outputDir)}`
        )
      }
      resolve()
    })
    destStream.on('error', (err) => {
      logger.error('[JavaScript] Error during processing:', err)
      reject(err)
    })
  })
}
