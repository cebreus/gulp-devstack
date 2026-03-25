import gulp from 'gulp'

import * as config from '../config.js'
import logger from '../utils/logger.js'
import { initializeImageOptimizers } from '../utils/module-manager.js'
import imagemin from 'gulp-imagemin'
import plumber from 'gulp-plumber'
import path from 'node:path'
import pc from 'picocolors'
import through2 from 'through2'

/**
 * Optimizes images using the specified imagemin plugin.
 * @param {string|string[]} src - Source file(s) to optimize.
 * @param {string} dest - Destination directory for optimized images.
 * @param {Function} imageminPlugin - Imagemin plugin to use for optimization.
 * @param {object} [options] - Additional options.
 * @param {string} [options.logPrefix] - Prefix for log messages (default: 'Images').
 * @returns {Promise<void>} Resolves when optimization is complete.
 */
async function optimizeImage(src, dest, imageminPlugin, options = {}) {
  const { logPrefix = 'Images' } = options
  const destination = dest || config.imagesBuild()
  if (!destination) {
    logger.error(`[${logPrefix}] Invalid destination for optimization`)
    throw new Error(`[${logPrefix}] Invalid destination`)
  }
  logger.debug(`[${logPrefix}] Optimizing files from ${src} to ${destination}`)
  return new Promise((resolve, reject) => {
    const processedFiles = []
    gulp
      .src(src)
      .pipe(plumber())
      .pipe(imagemin([imageminPlugin]))
      .pipe(
        through2.obj(function (file, enc, cb) {
          const outPath = path.join(destination, path.basename(file.path))
          processedFiles.push(path.relative(process.cwd(), outPath))
          cb(null, file)
        })
      )
      .pipe(gulp.dest(destination))
      .on('end', () => {
        if (processedFiles.length > 0) {
          logger.verbose(
            `[${logPrefix}] Optimized:\n` +
              processedFiles
                .map((f) => `            - ${pc.yellow(f)}`)
                .join('\n')
          )
        } else {
          logger.verbose(`[${logPrefix}] No files processed.`)
        }
        resolve()
      })
      .on('error', (err) => {
        logger.error(`[${logPrefix}] Error during optimization:`, err)
        reject(err)
      })
  })
}

/**
 * Optimizes JPG images using imagemin-mozjpeg with centralized module management
 * @param {string|string[]} src - Source file(s) to optimize
 * @param {string} dest - Destination directory for optimized images
 * @param {object} [options] - Additional options
 * @param {number} [options.quality] - JPEG quality (0-100)
 * @returns {Promise<void>} Resolves when optimization is complete
 */
export async function optimizeJpg(src, dest, options = {}) {
  const { quality = 85 } = options

  try {
    const { mozjpeg } = await initializeImageOptimizers()
    const mozjpegPlugin = mozjpeg.default

    await optimizeImage(
      src,
      dest,
      mozjpegPlugin({ quality, progressive: true }),
      {
        logPrefix: 'ImagesJPG',
      }
    )
  } catch (error) {
    logger.error('[ImagesJPG] Failed to initialize JPEG optimizer:', error)
    throw error
  }
}

/**
 * Optimizes PNG images using gulp-upng with centralized module management
 * @param {string|string[]} src - Source file(s) to optimize
 * @param {string} dest - Destination directory for optimized images
 * @returns {Promise<void>} Resolves when optimization is complete
 */
export async function optimizePng(src, dest) {
  const destination = dest || config.imagesBuild()

  if (!destination) {
    logger.error('[ImagesPNG] Invalid destination for PNG optimization')
    throw new Error('[ImagesPNG] Invalid destination')
  }

  try {
    logger.debug(
      `[ImagesPNG] Optimizing PNG files from ${src} to ${destination}`
    )
    const { upng } = await initializeImageOptimizers()
    const upngPlugin = upng.default

    return new Promise((resolve, reject) => {
      const processedFiles = []
      gulp
        .src(src)
        .pipe(plumber())
        .pipe(upngPlugin())
        .pipe(
          through2.obj(function (file, enc, cb) {
            const outPath = path.join(destination, path.basename(file.path))
            processedFiles.push(path.relative(process.cwd(), outPath))
            cb(null, file)
          })
        )
        .pipe(gulp.dest(destination))
        .on('end', () => {
          if (processedFiles.length > 0) {
            logger.verbose(
              '[ImagesPNG] Optimized:\n' +
                processedFiles
                  .map((f) => `            - ${pc.yellow(f)}`)
                  .join('\n')
            )
          } else {
            logger.verbose('[ImagesPNG] No PNG files processed.')
          }
          resolve()
        })
        .on('error', (err) => {
          logger.error('[ImagesPNG] Error during optimization:', err)
          reject(err)
        })
    })
  } catch (error) {
    logger.error('[ImagesPNG] Failed to initialize PNG optimizer:', error)
    throw error
  }
}

/**
 * Optimizes SVG images using imagemin-svgo with centralized module management
 * @param {string|string[]} src - Source file(s) to optimize
 * @param {string} dest - Destination directory for optimized images
 * @returns {Promise<void>} Resolves when optimization is complete
 */
export async function optimizeSvg(src, dest) {
  try {
    const { svgo } = await initializeImageOptimizers()
    const svgoPlugin = svgo.default

    await optimizeImage(
      src,
      dest,
      svgoPlugin({
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: {
                removeViewBox: false,
                cleanupIds: false,
              },
            },
          },
          'removeUselessStrokeAndFill',
          'removeEmptyAttrs',
        ],
      }),
      { logPrefix: 'ImagesSVG' }
    )
  } catch (error) {
    logger.error('[ImagesSVG] Failed to initialize SVG optimizer:', error)
    throw error
  }
}
