import gulp from 'gulp'

import { initializeGoogleWebFonts } from '../utils/legacy-modules.js'
import logger from '../utils/logger.js'
import path from 'node:path'
import pc from 'picocolors'

/**
 * Loads fonts using Google Web Fonts with modern module management
 * @param {string} input - The input glob or file path for font definitions
 * @param {string} output - The output directory for the generated fonts
 * @param {object} [options] - Optional configuration object
 * @returns {Promise<void>} Resolves when the font loading is complete
 */
export default async function fontLoad(input, output, options = {}) {
  if (typeof input !== 'string' || typeof output !== 'string') {
    logger.error('[Fonts] Invalid input or output type. Both must be strings.')
    return Promise.resolve()
  }

  const { config = {} } = options

  try {
    const googleWebFonts = initializeGoogleWebFonts()

    logger.info(`[Fonts] Loading fonts from: ${pc.yellow(input)}`)
    logger.info(`[Fonts] Output directory: ${pc.yellow(output)}`)

    await new Promise((resolve, reject) => {
      const writtenFiles = []
      gulp
        .src(input)
        .on('data', (file) =>
          logger.debug(
            `[Fonts] From: ${pc.yellow(path.relative(process.cwd(), file.path))}`
          )
        )
        .pipe(googleWebFonts(config))
        .pipe(gulp.dest(output))
        .on('data', (file) => {
          const relPath = path.relative(process.cwd(), file.path)
          writtenFiles.push(relPath)
        })
        .on('end', () => {
          if (writtenFiles.length > 0) {
            logger.verbose(
              `[Fonts] Written font files:\n${writtenFiles.map((f) => `            - ${pc.yellow(f)}`).join('\n')}`
            )
          } else {
            logger.info('[Fonts] No font files were written.')
          }
          resolve()
        })
        .on('error', (err) => {
          logger.error(`[Fonts] Error during font pipeline: ${err.message}`)
          reject(err)
        })
    })
  } catch (error) {
    logger.error('[Fonts] Font loading initialization failed:', error)
    throw error
  }
}
