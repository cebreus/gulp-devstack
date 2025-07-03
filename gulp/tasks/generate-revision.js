import fs from 'node:fs'
import rev from 'gulp-rev'
import revDeleteOriginal from 'gulp-rev-delete-original'
import revRewrite from 'gulp-rev-rewrite'
import { dest, src } from 'gulp'

import { streamToPromise } from '../utils/helpers.js'
import loggerLib from '../utils/logger.js'

/**
 * @typedef {object} RevisionOptions
 * @property {string|string[]} inputAssets - Glob patterns for assets to be versioned
 * @property {string|string[]} inputHtml - Glob patterns for HTML files to update references in
 * @property {string} buildBase - Absolute or relative path to the build root
 * @property {string} manifestPath - Path where the rev-manifest.json should be stored
 * @property {boolean} [verbose=false] - Whether to enable detailed logging
 */

const logger = loggerLib.createLogger('Revision')

/**
 * Gulp Task: Implements asset revisioning (fingerprinting).
 * Appends content hashes to filenames and updates all references in HTML archives.
 * @param {RevisionOptions} options - Configuration for the revision process
 * @returns {Promise<void>} Resolves when all assets are versioned and HTML updated
 */
export async function generateRevision(options) {
  const { inputAssets, inputHtml, buildBase, manifestPath } = options

  try {
    // Phase 1: Create fingerprints and manifest
    logger.debug('Generating asset fingerprints and manifest...')
    const assetPipeline = src(inputAssets, { base: buildBase })
      .pipe(rev())
      .pipe(revDeleteOriginal())
      .pipe(dest(buildBase))
      .pipe(rev.manifest(manifestPath))
      .pipe(dest('.'))

    await streamToPromise(assetPipeline)

    // Phase 2: Rewrite references within HTML files
    logger.debug(`Rewriting HTML references using manifest: ${manifestPath}`)
    const manifestBuffer = fs.readFileSync(manifestPath)

    const htmlPipeline = src(inputHtml, { base: buildBase })
      .pipe(revRewrite({ manifest: manifestBuffer }))
      .pipe(dest(buildBase))

    await streamToPromise(htmlPipeline)

    logger.verbose('Asset fingerprinting and HTML reference updates finished.')
  } catch (error) {
    logger.error('Critical failure during asset revisioning.', error)
    throw error
  }
}

export default generateRevision
