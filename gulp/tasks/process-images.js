import path from 'node:path'
import { Transform } from 'node:stream'
import gulpNewer from 'gulp-newer'
import gulp from 'gulp'

import loggerLib, {
  attachPipelineLogging,
  detectType,
  getLqsPlaceholder,
  getRelativePath,
  isPrivateFile,
  optimizeWithSharp,
  streamToPromise,
} from '../utils/index.js'

const logger = loggerLib.createLogger('ProcessImages')

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
      const fileName = path.basename(file.path)

      if (file.contents.length === 0) {
        logger.warn(`Skipping empty file: ${fileName}`)
        file._isInvalid = true
        return cb(null, file)
      }

      const actualType = detectType(file.contents)

      if (
        file.contents[0] === 0xef &&
        file.contents[1] === 0xbf &&
        file.contents[2] === 0xbd
      ) {
        logger.error(`${fileName} is BINARY CORRUPTED. Dropping.`)
        file._isInvalid = true
        return cb(null, file)
      }

      if (!actualType) {
        logger.warn(`Skipping ${fileName}: Unknown signature.`)
        file._isInvalid = true
        return cb(null, file)
      }
      cb(null, file)
    },
  })
}

/**
 * Generic task executor for raster formats using Sharp.
 * @param {string|string[]} src - Source glob pattern(s)
 * @param {string} dest - Destination directory
 * @param {string} targetType - The type to process/output
 * @param {object} options - Custom optimization options
 * @param {string} [options.logPrefix] - Prefix for logger messages
 * @param {number} [options.quality] - Target quality for lossy formats (0-100)
 * @param {boolean} [options.lqs] - Whether to generate LQS placeholder logs
 * @returns {Promise<void>} Resolves when the stream finishes
 */
async function executeRasterTask(src, dest, targetType, options = {}) {
  const { logPrefix = 'Images', quality = 85, lqs = false } = options
  const targetDir = dest
  const processedFiles = []

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

            const savedBytes = original.length - optimized.length
            const percentSaved = Math.round(
              (savedBytes / original.length) * 100
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

              if (percentSaved > 10) {
                logger.verbose(
                  `[${logPrefix}] ${path.basename(file.path)} optimized: -${percentSaved}% (${(savedBytes / 1024).toFixed(1)} KB saved)`
                )
              }
            } else {
              logger.verbose(
                `[${logPrefix}] Keeping original ${path.basename(file.path)} (optimized was larger)`
              )
            }

            processedFiles.push(
              getRelativePath(path.join(targetDir, path.basename(file.path)))
            )
            cb(null, file)
          } catch (err) {
            logger.error(
              `Image optimization failed for ${path.basename(file.path)}. Cause: ${err.message}. Falling back to original.`
            )
            processedFiles.push(
              getRelativePath(path.join(targetDir, path.basename(file.path)))
            )
            cb(null, file)
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

  try {
    const streamDone = await streamToPromise(pipeline)
    return streamDone
  } catch (error) {
    logger.error(
      `[${logPrefix}] Optimization pipeline failed. Cause: ${error.message}`
    )
    throw error
  }
}

/**
 * Gulp task: Optimize JPEG images.
 * @param {string|string[]} src - Source glob pattern(s)
 * @param {string} dest - Destination directory
 * @param {object} options - Custom optimization options
 * @param {string} [options.logPrefix] - Prefix for logger messages
 * @param {number} [options.quality] - Target quality for lossy formats (0-100)
 * @param {boolean} [options.lqs] - Whether to generate LQS placeholder logs
 * @returns {Promise<void>} Resolves when the stream finishes
 * @throws {Error} If JPEG optimization fails
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
 * @throws {Error} If PNG optimization fails
 */
export async function optimizePng(src, dest) {
  const targetDir = dest
  const processedFiles = []

  const mod = await import('gulp-upng')
  const upng = mod.default || mod

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
              if (optFile.contents.length < file.contents.length) {
                file.contents = optFile.contents
              }
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

  attachPipelineLogging({
    stream: pipeline,
    loggerInstance: logger,
    trackedFiles: processedFiles,
    successLabel: '[Images:PNG] Processed assets',
    emptyMessage: '[Images:PNG] No new PNG images needed.',
    errorMessage: '[Images:PNG] Error:',
  })

  try {
    await streamToPromise(pipeline)
  } catch (error) {
    throw new Error('[Images:PNG] Optimization pipeline failed.', {
      cause: error,
    })
  }
}

/**
 * Gulp task: Optimize SVG images using SVGO.
 * @param {string|string[]} src - Source glob pattern(s)
 * @param {string} dest - Destination directory
 * @returns {Promise<void>} Resolves when the stream finishes
 * @throws {Error} If SVG optimization fails
 */
export async function optimizeSvg(src, dest) {
  const targetDir = dest
  const processedFiles = []

  const imageminMod = await import('gulp-imagemin')
  const svgoMod = await import('imagemin-svgo')
  const imagemin = imageminMod.default || imageminMod
  const svgo = svgoMod.default || svgoMod

  const pipeline = gulp
    .src(src, { encoding: false })
    .pipe(
      new Transform({
        objectMode: true,
        transform(file, _enc, cb) {
          if (isPrivateFile(file.path)) return cb(null, null)
          cb(null, file)
        },
      })
    )
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

  pipeline.on('data', (file) => {
    processedFiles.push(getRelativePath(file.path))
  })

  attachPipelineLogging({
    stream: pipeline,
    loggerInstance: logger,
    trackedFiles: processedFiles,
    successLabel: '[Images:SVG] Processed assets',
    emptyMessage: '[Images:SVG] No new SVG images needed.',
    errorMessage: '[Images:SVG] Error:',
  })

  try {
    await streamToPromise(pipeline)
  } catch (error) {
    throw new Error('[Images:SVG] Optimization pipeline failed.', {
      cause: error,
    })
  }
}

/**
 * Gulp task: Convert images to WebP format.
 * @param {string|string[]} src - Source glob pattern(s)
 * @param {string} dest - Destination directory
 * @returns {Promise<import('node:stream').Stream>} Resolves when the stream finishes
 * @throws {Error} If WebP conversion fails
 */
export async function convertToWebp(src, dest) {
  return executeRasterTask(src, dest, 'webp', { logPrefix: 'Images:WebP' })
}

/**
 * Gulp task: Convert images to AVIF format.
 * @param {string|string[]} src - Source glob pattern(s)
 * @param {string} dest - Destination directory
 * @returns {Promise<import('node:stream').Stream>} Resolves when the stream finishes
 * @throws {Error} If AVIF conversion fails
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
