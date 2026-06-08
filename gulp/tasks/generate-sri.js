import path from 'node:path'
import { dest, src } from 'gulp'

import { stripTrailingLineWhitespace } from '../utils/html-output.js'
import loggerLib, { isPrivateFile, streamToPromise } from '../utils/index.js'

const logger = loggerLib.createLogger('GenerateSri')

/**
 * Gulp Task: Injects Subresource Integrity (SRI) hashes into HTML files.
 * Provides security by ensuring that fetched resources have not been tampered with.
 * @param {string|string[]} input - Glob pattern(s) for HTML files
 * @param {string} outputDir - Destination directory
 * @returns {Promise<import('node:stream').Stream>} Gulp stream
 */
export default async function generateSri(input, outputDir) {
  if (!input || !outputDir) {
    logger.warn('SRI task skipped: invalid input or output parameters.')
    const { Readable } = await import('node:stream')
    return Readable.from([])
  }

  const { default: sri } = await import('gulp-sri-hash')
  const { Transform } = await import('node:stream')

  const sriPipeline = src(input)
    .pipe(
      new Transform({
        objectMode: true,
        transform(file, _enc, cb) {
          if (isPrivateFile(file.path)) {
            return cb(null, null)
          }
          cb(null, file)
        },
      })
    )
    .pipe(
      sri({
        selector: 'script[src], link[rel="stylesheet"]',
        root: path.resolve(outputDir),
        onError: (err) => {
          logger.warn(
            `SRI error for a file: ${err.message}. Skipping specific tag.`
          )
        },
      })
    )
    .pipe(
      new Transform({
        objectMode: true,
        transform(file, _enc, cb) {
          if (file?.contents) {
            file.contents = Buffer.from(
              stripTrailingLineWhitespace(file.contents.toString())
            )
          }
          cb(null, file)
        },
      })
    )
    .pipe(dest(outputDir))

  try {
    await streamToPromise(sriPipeline)
    logger.verbose(`Integrity hashes successfully injected into: ${outputDir}`)
  } catch (error) {
    logger.error(`Failed to generate SRI hashes. Cause: ${error.message}`)
    throw error
  }
}
