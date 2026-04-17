import fs from 'node:fs/promises'
import gulp from 'gulp'

import loggerLib, {
  attachPipelineLogging,
  getRelativePath,
  isPrivateFile,
  streamToPromise,
} from '../utils/index.js'

const logger = loggerLib.createLogger('GenerateRevision')

/**
 * Gulp Task: Implements asset revisioning (fingerprinting).
 * Appends content hashes to filenames and updates all references in HTML archives.
 * @param {object} options - Configuration for the revision process
 * @param {string|string[]} options.inputAssets - Glob patterns for assets to be versioned
 * @param {string|string[]} options.inputHtml - Glob patterns for HTML files to update references in
 * @param {string} options.buildBase - Absolute or relative path to the build root
 * @param {string} options.manifestPath - Path where the rev-manifest.json should be stored
 * @param {boolean} [options.verbose] - Whether to enable detailed logging
 * @returns {Promise<void>} Resolves when all assets are versioned and HTML updated
 */
export async function generateRevision(options) {
  const { inputAssets, inputHtml, buildBase, manifestPath } = options

  try {
    const { Transform } = await import('node:stream')
    const { default: rev } = await import('gulp-rev')
    const { default: revDeleteOriginal } =
      await import('gulp-rev-delete-original')
    const { default: revRewrite } = await import('gulp-rev-rewrite')

    const trackedAssets = []
    const trackedHtml = []

    logger.debug('Generating asset fingerprints and manifest...')
    const assetPipeline = gulp
      .src(inputAssets, { base: buildBase })
      .pipe(
        new Transform({
          objectMode: true,
          transform(file, _enc, cb) {
            if (isPrivateFile(file.path)) return cb(null, null)
            cb(null, file)
          },
        })
      )
      .pipe(rev())
      .pipe(revDeleteOriginal())
      .pipe(gulp.dest(buildBase))
      .pipe(rev.manifest(manifestPath))
      .pipe(gulp.dest('.'))

    assetPipeline.on('data', (file) => {
      if (file.path) trackedAssets.push(getRelativePath(file.path))
    })

    attachPipelineLogging({
      stream: assetPipeline,
      loggerInstance: logger,
      trackedFiles: trackedAssets,
      successLabel: 'Revisioned assets',
      emptyMessage: 'No assets were revisioned.',
      errorMessage: 'Asset revision pipeline failed!',
    })

    await streamToPromise(assetPipeline)

    logger.debug(`Rewriting HTML references using manifest: ${manifestPath}`)
    const manifestBuffer = await fs.readFile(manifestPath)

    const htmlPipeline = gulp
      .src(inputHtml, { base: buildBase })
      .pipe(
        new Transform({
          objectMode: true,
          transform(file, _enc, cb) {
            if (isPrivateFile(file.path)) return cb(null, null)
            cb(null, file)
          },
        })
      )
      .pipe(revRewrite({ manifest: manifestBuffer }))
      .pipe(gulp.dest(buildBase))

    htmlPipeline.on('data', (file) => {
      if (file.path) trackedHtml.push(getRelativePath(file.path))
    })

    attachPipelineLogging({
      stream: htmlPipeline,
      loggerInstance: logger,
      trackedFiles: trackedHtml,
      successLabel: 'HTML references updated',
      emptyMessage: 'No HTML files were updated with revision hashes.',
      errorMessage: 'HTML revision rewrite failed!',
    })

    await streamToPromise(htmlPipeline)

    logger.verbose('Asset fingerprinting and HTML reference updates finished.')
  } catch (error) {
    throw new Error('Critical failure during asset revisioning.', {
      cause: error,
    })
  }
}

export default generateRevision
