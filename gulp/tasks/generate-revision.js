import fs from 'node:fs/promises'
import path from 'node:path'
import gulp from 'gulp'

import {
  stripBooleanAttributeValues,
  stripTrailingLineWhitespace,
} from '../utils/html-output.js'
import loggerLib, {
  attachPipelineLogging,
  getRelativePath,
  isPrivateFile,
  streamToPromise,
} from '../utils/index.js'
import { createPrivateFileFilter } from '../utils/private-streams.js'

const logger = loggerLib.createLogger('GenerateRevision')

function trackPipelineFiles(pipeline, trackedFiles) {
  pipeline.on('data', (file) => {
    if (file.path) {
      trackedFiles.push(getRelativePath(file.path))
    }
  })
}

async function removeOriginalRevisionSources(buildBase, manifestPath) {
  const manifestContent = await fs.readFile(manifestPath, 'utf8')
  const manifest = JSON.parse(manifestContent)

  await Promise.all(
    Object.keys(manifest).map(async function removeOriginalFile(assetPath) {
      const originalAssetPath = path.join(buildBase, assetPath)

      try {
        await fs.unlink(originalAssetPath)
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw new Error(`Failed to remove original asset: ${assetPath}`, {
            cause: error,
          })
        }
      }
    })
  )
}

async function runAssetRevisionPipeline({
  buildBase,
  inputAssets,
  manifestPath,
  rev,
}) {
  const trackedAssets = []
  const assetPipeline = gulp
    .src(inputAssets, { base: buildBase })
    .pipe(createPrivateFileFilter(isPrivateFile))
    .pipe(rev())
    .pipe(gulp.dest(buildBase))
    .pipe(rev.manifest(manifestPath))
    .pipe(gulp.dest('.'))

  trackPipelineFiles(assetPipeline, trackedAssets)
  attachPipelineLogging({
    stream: assetPipeline,
    loggerInstance: logger,
    trackedFiles: trackedAssets,
    successLabel: 'Revisioned assets',
    emptyMessage: 'No assets were revisioned.',
    errorMessage: 'Asset revision pipeline failed!',
  })

  await streamToPromise(assetPipeline)
}

async function runHtmlRewritePipeline({
  buildBase,
  inputHtml,
  manifestPath,
  revRewrite,
}) {
  const trackedHtml = []
  const { Transform } = await import('node:stream')
  logger.debug(`Rewriting HTML references using manifest: ${manifestPath}`)
  const manifestBuffer = await fs.readFile(manifestPath)

  const htmlPipeline = gulp
    .src(inputHtml, { base: buildBase })
    .pipe(createPrivateFileFilter(isPrivateFile))
    .pipe(revRewrite({ manifest: manifestBuffer }))
    .pipe(
      new Transform({
        objectMode: true,
        transform(file, _enc, cb) {
          if (file?.contents) {
            file.contents = Buffer.from(
              stripTrailingLineWhitespace(
                stripBooleanAttributeValues(file.contents.toString())
              )
            )
          }
          cb(null, file)
        },
      })
    )
    .pipe(gulp.dest(buildBase))

  trackPipelineFiles(htmlPipeline, trackedHtml)
  attachPipelineLogging({
    stream: htmlPipeline,
    loggerInstance: logger,
    trackedFiles: trackedHtml,
    successLabel: 'HTML references updated',
    emptyMessage: 'No HTML files were updated with revision hashes.',
    errorMessage: 'HTML revision rewrite failed!',
  })

  await streamToPromise(htmlPipeline)
}

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
export default async function generateRevision(options) {
  const { inputAssets, inputHtml, buildBase, manifestPath } = options

  try {
    const { default: rev } = await import('gulp-rev')
    const { default: revRewrite } = await import('gulp-rev-rewrite')

    logger.debug('Generating asset fingerprints and manifest...')
    await runAssetRevisionPipeline({
      buildBase,
      inputAssets,
      manifestPath,
      rev,
    })
    await runHtmlRewritePipeline({
      buildBase,
      inputHtml,
      manifestPath,
      revRewrite,
    })
    await removeOriginalRevisionSources(buildBase, manifestPath)

    logger.verbose('Asset fingerprinting and HTML reference updates finished.')
  } catch (error) {
    throw new Error('Critical failure during asset revisioning.', {
      cause: error,
    })
  }
}
