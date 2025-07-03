import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import pc from 'picocolors'
import gulp from 'gulp'

import {
  attachPipelineLogging,
  getRelativePath,
  streamToPromise,
} from '../utils/helpers.js'
import loggerLib from '../utils/logger.js'

const require = createRequire(import.meta.url)
const googleWebFontsPlugin = require('gulp-google-webfonts')

const logger = loggerLib.createLogger('Fonts')

/**
 * @typedef {object} FontProcessingOptions
 * @property {object} [config] - Plugin-specific configuration for gulp-google-webfonts
 */

/**
 * Gulp Task: Downloads and prepares web fonts via Google Fonts API.
 * Uses 'gulp-google-webfonts' to generate local assets and CSS.
 * @param {string} input - Path or glob to font definition file
 * @param {string} outputDir - Destination directory for fonts and styles
 * @param {FontProcessingOptions} [options] - Task options
 * @returns {Promise<void>} Resolves when the font pipeline finishes
 */
export async function processFonts(input, outputDir, options = {}) {
  if (!input || !outputDir) {
    logger.warn('Font task skipped: invalid input or output parameters.')
    return
  }

  try {
    const pluginConfig = options.config || {}
    const fontsDir = path.join(
      outputDir,
      pluginConfig.fontsDir || 'assets/fonts/'
    )
    const cssFile = path.join(
      outputDir,
      pluginConfig.cssDir || 'assets/css/',
      pluginConfig.cssFilename || 'fonts.css'
    )

    if (fs.existsSync(cssFile) && fs.existsSync(fontsDir)) {
      const inputStats = fs.statSync(input)
      const cssStats = fs.statSync(cssFile)
      const fonts = fs.readdirSync(fontsDir)

      if (inputStats.mtime <= cssStats.mtime && fonts.length > 0) {
        logger.debug(
          `Fonts are up to date (last updated: ${pc.yellow(cssStats.mtime.toLocaleString())}), skipping.`
        )
        return
      }
    }

    const trackedFiles = []

    // Check if input file is empty
    const stats = fs.statSync(input)
    if (stats.size === 0) {
      logger.warn(
        `Font definition file ${pc.cyan(input)} is empty. Skipping font task.`
      )
      return
    }

    logger.info(`Processing font definitions from ${pc.cyan(input)}`)

    const fontPipeline = gulp
      .src(input)
      .pipe(googleWebFontsPlugin(pluginConfig))
      .pipe(gulp.dest(outputDir))

    fontPipeline.on('data', (file) => {
      trackedFiles.push(getRelativePath(file.path))
    })

    attachPipelineLogging({
      stream: fontPipeline,
      loggerInstance: logger,
      trackedFiles,
      successLabel: 'Font assets generated',
      emptyMessage: 'Font task finished: no assets were changed.',
      errorMessage: 'Font processing stream failed!',
    })

    await streamToPromise(fontPipeline)
  } catch (error) {
    logger.error('Critical failure in font processing pipeline.', error)
    throw error
  }
}

export default processFonts
