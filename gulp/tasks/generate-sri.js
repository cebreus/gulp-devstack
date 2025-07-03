import htmlmin from 'gulp-htmlmin'
import sri from 'gulp-sri-hash'
import { dest, src } from 'gulp'

import loggerLib from '../utils/logger.js'

const logger = loggerLib.createLogger('SRI')

/**
 * Gulp Task: Injects Subresource Integrity (SRI) hashes into HTML files.
 * Provides security by ensuring that fetched resources have not been tampered with.
 * @param {string|string[]} input - Glob pattern(s) for HTML files
 * @param {string} outputDir - Destination directory
 * @returns {import('node:stream').Readable} Gulp stream
 */
export function generateSri(input, outputDir) {
  const sriPipeline = src(input)
    .pipe(sri())
    // Note: Re-minification is performed to reconcile any tag attribute
    // modifications made by the SRI plugin (e.g. normalizing boolean attributes).
    .pipe(
      htmlmin({
        collapseWhitespace: true,
        collapseBooleanAttributes: true,
      })
    )
    .pipe(dest(outputDir))

  sriPipeline.on('end', () => {
    logger.verbose(`Integrity hashes successfully injected into: ${outputDir}`)
  })

  sriPipeline.on('error', (err) => {
    logger.error('Failed to generate SRI hashes.', err)
  })

  return sriPipeline
}

export default generateSri
