import path from 'node:path'
import { Transform } from 'node:stream'
import gulp from 'gulp'

import * as config from '../config.js'
import {
  attachPipelineLogging,
  getRelativePath,
  streamToPromise,
} from '../utils/helpers.js'
import loggerLib from '../utils/logger.js'

/**
 * @typedef {object} ImageOptimizationOptions
 * @property {string} [logPrefix='Images'] - Prefix for logger messages
 * @property {number} [quality] - Target quality for lossy formats (0-100)
 * @property {boolean} [lqs=false] - Whether to generate LQS placeholder logs
 */

const logger = loggerLib.createLogger('Images')

/**
 * Detects image type from buffer magic bytes.
 * @param {Buffer} buffer - The image file buffer
 * @returns {string|null} The detected type ('png', 'jpg', 'webp', 'svg') or null
 */
export function detectType(buffer) {
  if (!buffer || buffer.length < 3) return null
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  )
    return 'png'
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
    return 'jpg'
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  )
    return 'webp'
  if (buffer.length >= 4) {
    const start = buffer.slice(0, 100).toString().trim().toLowerCase()
    if (start.includes('<svg') || start.includes('<?xml')) return 'svg'
  }
  return null
}

/**
 * Generates a Low Quality Image Placeholder (Base64).
 * ~20px WebP, blurred, ultra-low quality.
 * @param {Buffer} buffer - Source image buffer
 * @returns {Promise<string>} Data URI string
 */
export async function getLqsPlaceholder(buffer) {
  const { default: sharp } = await import('sharp')
  const lqsBuffer = await sharp(buffer)
    .resize(20)
    .blur(1)
    .webp({ quality: 10 })
    .toBuffer()
  return `data:image/webp;base64,${lqsBuffer.toString('base64')}`
}

/**
 * Validation stream to prevent corruption and mismatched processing.
 * @param {string} _expectedType - The image type expected by the current task
 * @returns {Transform} A Gulp transform stream
 */
export function validateImage(_expectedType) {
  return new Transform({
    objectMode: true,
    transform(file, _enc, cb) {
      if (!file.isBuffer()) return cb(null, file)
      const actualType = detectType(file.contents)
      const fileName = path.basename(file.path)

      if (
        file.contents[0] === 0xef &&
        file.contents[1] === 0xbf &&
        file.contents[2] === 0xbd
      ) {
        logger.error(`[Images] ${fileName} is BINARY CORRUPTED. Dropping.`)
        file._isInvalid = true
        return cb(null, file)
      }

      if (!actualType) {
        logger.warn(`[Images] Skipping ${fileName}: Unknown signature.`)
        file._isInvalid = true
        return cb(null, file)
      }
      cb(null, file)
    },
  })
}

/**
 * Sharp-based optimization logic including AVIF.
 * @param {Buffer} buffer - The source image buffer
 * @param {string} targetType - Target format ('jpg', 'png', 'webp', 'avif')
 * @param {number} quality - Target quality (0-100)
 * @returns {Promise<Buffer>} The optimized image buffer
 */
export async function optimizeWithSharp(buffer, targetType, quality) {
  const { default: sharp } = await import('sharp')
  const instance = sharp(buffer).rotate()

  switch (targetType) {
    case 'jpg':
      return instance
        .jpeg({ quality, mozjpeg: true, progressive: true })
        .toBuffer()
    case 'webp':
      return instance.webp({ quality }).toBuffer()
    case 'avif':
      return instance
        .avif({ quality: Math.max(quality - 20, 40), speed: 5 })
        .toBuffer()
    case 'png':
      return instance.png({ compressionLevel: 9, palette: true }).toBuffer()
    default:
      return buffer
  }
}

/**
 * Generic task executor for raster formats using Sharp.
 * @param {string|string[]} src - Source glob pattern(s)
 * @param {string} dest - Destination directory
 * @param {string} targetType - The type to process/output
 * @param {ImageOptimizationOptions} options - Custom optimization options
 * @returns {Promise<void>} Resolves when the stream finishes
 */
async function executeRasterTask(src, dest, targetType, options = {}) {
  const { logPrefix = 'Images', quality = 85, lqs = false } = options
  const targetDir = dest || config.imagesBuild()
  const processedFiles = []
  const { default: gulpNewer } = await import('gulp-newer')

  const pipeline = gulp
    .src(src, { encoding: false })
    .pipe(gulpNewer({ dest: targetDir, ext: `.${targetType}` }))
    .pipe(validateImage(targetType))
    .pipe(
      new Transform({
        objectMode: true,
        async transform(file, _enc, cb) {
          if (file._isInvalid) return cb(null, null)

          try {
            const original = Buffer.from(file.contents)

            if (lqs) {
              const placeholder = await getLqsPlaceholder(original)
              logger.info(
                `[LQS] ${path.basename(file.path)}: ${placeholder.slice(0, 50)}...`
              )
            }

            const optimized = await optimizeWithSharp(
              original,
              targetType,
              quality
            )

            if (
              targetType === 'webp' ||
              targetType === 'avif' ||
              optimized.length < original.length
            ) {
              file.contents = optimized
              file.path = file.path.replace(
                path.extname(file.path),
                `.${targetType}`
              )
            } else {
              logger.verbose(
                `[${logPrefix}] Keeping original ${path.basename(file.path)}`
              )
            }

            processedFiles.push(
              getRelativePath(path.join(targetDir, path.basename(file.path)))
            )
            cb(null, file)
          } catch (err) {
            if (
              err.code === 'ERR_MODULE_NOT_FOUND' ||
              err.message.includes('sharp')
            ) {
              logger.warn(
                `[${logPrefix}] Sharp missing, fallback to original for ${path.basename(file.path)}`
              )
              return cb(null, file)
            }
            logger.error(
              `[${logPrefix}] Data Error for ${path.basename(file.path)}:`,
              err.message
            )
            cb(null, null)
          }
        },
      })
    )
    .pipe(gulp.dest(targetDir))

  attachPipelineLogging({
    stream: pipeline,
    loggerInstance: logger,
    trackedFiles: processedFiles,
    successLabel: `[${logPrefix}] Processed assets`,
    emptyMessage: `[${logPrefix}] No new ${targetType.toUpperCase()} needed.`,
    errorMessage: `[${logPrefix}] Error:`,
  })

  return streamToPromise(pipeline)
}

/**
 * Gulp task: Optimize JPEG images.
 * @param {string|string[]} src - Source glob pattern(s)
 * @param {string} dest - Destination directory
 * @param {ImageOptimizationOptions} options - Custom optimization options
 * @returns {Promise<void>} Resolves when the stream finishes
 */
export async function optimizeJpg(src, dest, options = {}) {
  return executeRasterTask(src, dest, 'jpg', {
    logPrefix: 'Images:JPG',
    ...options,
  })
}

/**
 * Gulp task: Optimize PNG images using UPNG.
 * @param {string|string[]} src - Source glob pattern(s)
 * @param {string} dest - Destination directory
 * @returns {Promise<void>} Resolves when the stream finishes
 */
export async function optimizePng(src, dest) {
  const targetDir = dest || config.imagesBuild()
  const processedFiles = []
  const { default: gulpNewer } = await import('gulp-newer')
  const { default: upng } = await import('gulp-upng')

  const pipeline = gulp
    .src(src, { encoding: false })
    .pipe(gulpNewer(targetDir))
    .pipe(validateImage('png'))
    .pipe(
      new Transform({
        objectMode: true,
        async transform(file, _enc, cb) {
          if (file._isInvalid) return cb(null, null)
          try {
            const upngStream = upng()
            upngStream.on('data', (optFile) => {
              if (optFile.contents.length < file.contents.length)
                file.contents = optFile.contents
              processedFiles.push(
                getRelativePath(path.join(targetDir, path.basename(file.path)))
              )
              cb(null, file)
            })
            upngStream.write(file)
            upngStream.end()
          } catch {
            cb(null, file)
          }
        },
      })
    )
    .pipe(gulp.dest(targetDir))
  return streamToPromise(pipeline)
}

/**
 * Gulp task: Optimize SVG images using SVGO.
 * @param {string|string[]} src - Source glob pattern(s)
 * @param {string} dest - Destination directory
 * @returns {Promise<void>} Resolves when the stream finishes
 */
export async function optimizeSvg(src, dest) {
  const targetDir = dest || config.imagesBuild()
  const { default: imagemin } = await import('gulp-imagemin')
  const { default: svgo } = await import('imagemin-svgo')
  const pipeline = gulp
    .src(src, { encoding: false })
    .pipe(validateImage('svg'))
    .pipe(
      imagemin([
        svgo({
          plugins: [
            {
              name: 'preset-default',
              params: { overrides: { cleanupIds: false } },
            },
          ],
        }),
      ])
    )
    .pipe(gulp.dest(targetDir))
  return streamToPromise(pipeline)
}

/**
 * Gulp task: Convert images to WebP format.
 * @param {string|string[]} src - Source glob pattern(s)
 * @param {string} dest - Destination directory
 * @returns {Promise<void>} Resolves when the stream finishes
 */
export async function convertToWebp(src, dest) {
  return executeRasterTask(src, dest, 'webp', { logPrefix: 'Images:WebP' })
}

/**
 * Gulp task: Convert images to AVIF format.
 * @param {string|string[]} src - Source glob pattern(s)
 * @param {string} dest - Destination directory
 * @returns {Promise<void>} Resolves when the stream finishes
 */
export async function convertToAvif(src, dest) {
  return executeRasterTask(src, dest, 'avif', { logPrefix: 'Images:AVIF' })
}

export default {
  jpg: optimizeJpg,
  png: optimizePng,
  svg: optimizeSvg,
  webp: convertToWebp,
  avif: convertToAvif,
}
