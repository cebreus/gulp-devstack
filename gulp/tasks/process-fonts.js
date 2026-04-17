import fs from 'node:fs/promises'
import path from 'node:path'
import { Transform } from 'node:stream'
import pc from 'picocolors'
import gulp from 'gulp'

import loggerLib, {
  attachPipelineLogging,
  getRelativePath,
  isPrivateFile,
  streamToPromise,
} from '../utils/index.js'

// googleWebFontsPlugin will be dynamically imported inside the task

const logger = loggerLib.createLogger('ProcessFonts')

/**
 * Gulp Task: Downloads and prepares web fonts via Google Fonts API.
 * Uses 'gulp-google-webfonts' to generate local assets and CSS.
 * @param {string} input - Path or glob to font definition file
 * @param {string} outputDir - Destination directory for fonts and styles
 * @param {object} [options] - Task options
 * @param {object} [options.config] - Plugin-specific configuration for gulp-google-webfonts
 * @param {string} [options.config.fontsDir] - Directory for font files
 * @param {string} [options.config.cssDir] - Directory for CSS files
 * @param {string} [options.config.cssFilename] - Filename for the generated CSS
 * @param {boolean} [options.minify] - Whether to minify the generated CSS
 * @returns {Promise<void>} Resolves when the font pipeline finishes
 * @throws {Error} If font processing fails
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
    let cssTargetName = pluginConfig.cssFilename || 'fonts.css'
    if (options.minify && !cssTargetName.includes('.min.')) {
      cssTargetName = cssTargetName.replace('.css', '.min.css')
    }

    const cssDir = pluginConfig.cssDir || 'assets/css/'
    const cssFile = path.join(outputDir, cssDir, cssTargetName)

    try {
      await fs.access(cssFile)
      await fs.access(fontsDir)

      const inputStats = await fs.stat(input)
      const cssStats = await fs.stat(cssFile)
      const fonts = await fs.readdir(fontsDir)

      const now = new Date()
      const isCssFromFuture = cssStats.mtime > new Date(now.getTime() + 5000)

      if (
        !isCssFromFuture &&
        inputStats.mtime <= cssStats.mtime &&
        fonts.length > 0
      ) {
        logger.debug(
          `Fonts are up to date (last updated: ${pc.yellow(cssStats.mtime.toLocaleString())}), skipping.`
        )
        return
      }

      if (isCssFromFuture) {
        logger.warn(
          `Font cache file ${pc.cyan(getRelativePath(cssFile))} has a future timestamp. Forcing rebuild.`
        )
      }
    } catch {
      // One of the paths doesn't exist, proceed with rebuild
    }

    const trackedFiles = []

    const stats = await fs.stat(input)
    if (stats.size === 0) {
      logger.warn(
        `Font definition file ${pc.cyan(input)} is empty. Skipping font task.`
      )
      return
    }

    let googleWebFontsPlugin
    try {
      const mod = await import('gulp-google-webfonts')
      googleWebFontsPlugin = mod.default || mod

      // Safety check: if it's still not a function, the import failed or structure is weird
      if (typeof googleWebFontsPlugin !== 'function') {
        throw new Error('gulp-google-webfonts is not a function after import')
      }
    } catch (importErr) {
      throw new Error(
        `Failed to load gulp-google-webfonts: ${importErr.message}`,
        { cause: importErr }
      )
    }

    logger.info(`Processing font definitions from ${pc.cyan(input)}`)

    const fontPipeline = gulp
      .src(input)
      .pipe(
        new Transform({
          objectMode: true,
          transform(file, _enc, cb) {
            if (isPrivateFile(file.path)) return cb(null, null)
            cb(null, file)
          },
        })
      )
      .pipe(googleWebFontsPlugin(pluginConfig))
      .pipe(
        new Transform({
          objectMode: true,
          async transform(file, _enc, cb) {
            if (options.minify && file.extname === '.css') {
              try {
                const postcssMod = await import('postcss')
                const cssnanoMod = await import('cssnano')
                const postcss = postcssMod.default || postcssMod
                const cssnano = cssnanoMod.default || cssnanoMod

                const result = await postcss([cssnano()]).process(
                  file.contents.toString(),
                  { from: undefined }
                )
                file.contents = Buffer.from(result.css)
                if (!file.basename.includes('.min.')) {
                  file.extname = `.min${file.extname}`
                }
              } catch (err) {
                return cb(err)
              }
            }
            cb(null, file)
          },
        })
      )
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

    try {
      await streamToPromise(fontPipeline)
    } catch (err) {
      fontPipeline.destroy()
      throw err
    }
  } catch (error) {
    logger.error(
      `Critical failure in font processing pipeline. Cause: ${error.message}`
    )
    throw error
  }
}

export default processFonts
