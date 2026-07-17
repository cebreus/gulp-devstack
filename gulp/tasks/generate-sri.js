import path from 'node:path'
import { dest, src } from 'gulp'

import {
  stripBooleanAttributeValues,
  stripTrailingLineWhitespace,
} from '../utils/html-output.js'
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
    throw new Error('SRI generation requires input and outputDir.')
  }

  const { default: sri } = await import('gulp-sri-hash')
  const { Transform } = await import('node:stream')

  const sriTransform = sri({
    selector: 'script[src], link[rel="stylesheet"]',
    root: path.resolve(outputDir),
    onError: (error) => {
      throw error
    },
  })
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
    .pipe(sriTransform)
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
    .pipe(dest(outputDir))

  sriTransform.on('error', function forwardSriError(error) {
    sriPipeline.destroy(error)
  })

  try {
    await streamToPromise(sriPipeline)
    logger.verbose(`Integrity hashes successfully injected into: ${outputDir}`)
  } catch (error) {
    logger.error(`Failed to generate SRI hashes. Cause: ${error.message}`)
    throw error
  }
}
