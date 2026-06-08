import { Transform } from 'node:stream'
import gulp from 'gulp'

import imagePipeline from '../utils/image-pipeline.js'
import loggerLib, {
  attachPipelineLogging,
  getRelativePath,
  isPrivateFile,
  streamToPromise,
} from '../utils/index.js'
import { createPrivateFileFilter } from '../utils/private-streams.js'

const logger = loggerLib.createLogger('ProcessImages')

/**
 * Validation stream to prevent corruption and mismatched processing.
 * @returns {Transform} A Gulp transform stream
 */
export function validateImage() {
  return imagePipeline.createImageValidationTransform(logger)
}

async function executeRasterTask(src, dest, targetType, options = {}) {
  return imagePipeline.executeRasterTask({
    src,
    dest,
    targetType,
    logger,
    ...options,
  })
}

async function optimizeJpg(src, dest, options = {}) {
  return executeRasterTask(src, dest, 'jpg', {
    logPrefix: 'Images:JPG',
    ...options,
  })
}

async function optimizePng(src, dest, options = {}) {
  return executeRasterTask(src, dest, 'png', {
    logPrefix: 'Images:PNG',
    ...options,
  })
}

async function optimizeSvg(src, dest) {
  const processedFiles = []

  const { optimize } = await import('svgo')

  const pipeline = gulp
    .src(src, { encoding: false })
    .pipe(createPrivateFileFilter(isPrivateFile))
    .pipe(validateImage())
    .pipe(
      new Transform({
        objectMode: true,
        transform(file, _enc, cb) {
          if (file._isInvalid || file.isNull()) {
            return cb(null, file)
          }
          if (file.isStream()) {
            return cb(new Error('Streaming not supported in SVGO transform'))
          }
          try {
            const svgStr = file.contents.toString('utf8')
            const result = optimize(svgStr, {
              path: file.path,
              plugins: [
                {
                  name: 'preset-default',
                  params: { overrides: { cleanupIds: false } },
                },
              ],
            })
            if (result.error) {
              return cb(new Error(result.error))
            }
            file.contents = Buffer.from(result.data)
            cb(null, file)
          } catch (error) {
            cb(error)
          }
        },
      })
    )
    .pipe(gulp.dest(dest))

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

async function convertToWebp(src, dest) {
  return executeRasterTask(src, dest, 'webp', { logPrefix: 'Images:WebP' })
}

async function convertToAvif(src, dest) {
  return executeRasterTask(src, dest, 'avif', { logPrefix: 'Images:AVIF' })
}

export default {
  jpg: optimizeJpg,
  png: optimizePng,
  svg: optimizeSvg,
  webp: convertToWebp,
  avif: convertToAvif,
}
