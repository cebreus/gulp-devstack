import { dest, src } from 'gulp'

import { isPrivateFile } from '../utils/helpers.js'
import loggerLib from '../utils/logger.js'

const logger = loggerLib.createLogger('SRI')

/**
 * Gulp Task: Injects Subresource Integrity (SRI) hashes into HTML files.
 * Provides security by ensuring that fetched resources have not been tampered with.
 * @param {string|string[]} input - Glob pattern(s) for HTML files
 * @param {string} outputDir - Destination directory
 * @returns {Promise<import('node:stream').Readable>} Gulp stream
 */
export async function generateSri(input, outputDir) {
  if (!input || !outputDir) {
    logger.warn('SRI task skipped: invalid input or output parameters.')
    const { Readable } = await import('node:stream')
    return Readable.from([])
  }

  const { default: sri } = await import('gulp-sri-hash')
  const { default: htmlmin } = await import('gulp-htmlmin')
  const { Transform } = await import('node:stream')

  const sriPipeline = src(input)
    .pipe(
      new Transform({
        objectMode: true,
        transform(file, _enc, cb) {
          if (isPrivateFile(file.path)) return cb(null, null)
          cb(null, file)
        },
      })
    )
    .pipe(
      sri({
        onError: (err) => {
          logger.warn(
            `SRI error for a file: ${err.message}. Skipping specific tag.`
          )
        },
      })
    )
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
