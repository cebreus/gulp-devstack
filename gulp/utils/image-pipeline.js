import path from 'node:path'
import { Transform } from 'node:stream'
import gulp from 'gulp'

import createChangedFilter from './changed-filter.js'
import { detectType, optimizeWithSharp } from './image-helpers.js'
import {
  attachPipelineLogging,
  getRelativePath,
  streamToPromise,
} from './index.js'

function getOutputAssetPath(filePath, dest) {
  return getRelativePath(path.join(dest, path.basename(filePath)))
}

function markProcessedFile(processedFiles, filePath, dest) {
  processedFiles.push(getOutputAssetPath(filePath, dest))
}

function isCorruptedUtf8Replacement(buffer) {
  return buffer[0] === 0xef && buffer[1] === 0xbf && buffer[2] === 0xbd
}

function createImageValidationTransform(logger) {
  return new Transform({
    objectMode: true,
    transform(file, _enc, cb) {
      if (!file.isBuffer()) {
        return cb(null, file)
      }

      const fileName = path.basename(file.path)
      if (file.contents.length === 0) {
        logger.warn(`Skipping empty file: ${fileName}`)
        file._isInvalid = true
        return cb(null, file)
      }

      if (isCorruptedUtf8Replacement(file.contents)) {
        logger.error(`${fileName} is BINARY CORRUPTED. Dropping.`)
        file._isInvalid = true
        return cb(null, file)
      }

      const actualType = detectType(file.contents)
      if (!actualType) {
        logger.warn(`Skipping ${fileName}: Unknown signature.`)
        file._isInvalid = true
      }

      cb(null, file)
    },
  })
}

async function optimizeRasterFile(file, options) {
  const { targetType, quality, logger, logPrefix } = options
  const original = file.contents

  const optimized = await optimizeWithSharp(original, targetType, quality)
  const savedBytes = original.length - optimized.length
  const percentSaved = Math.round((savedBytes / original.length) * 100)
  const shouldKeepOptimized =
    targetType === 'webp' ||
    targetType === 'avif' ||
    optimized.length < original.length

  if (!shouldKeepOptimized) {
    logger.verbose(
      `[${logPrefix}] Keeping original ${path.basename(file.path)} (optimized was larger)`
    )
    return file
  }

  file.contents = optimized
  file.path = file.path.replace(path.extname(file.path), `.${targetType}`)
  if (percentSaved > 10) {
    logger.verbose(
      `[${logPrefix}] ${path.basename(file.path)} optimized: -${percentSaved}% (${(savedBytes / 1024).toFixed(1)} KB saved)`
    )
  }

  return file
}

function createRasterOptimizationTransform(options) {
  const { targetType, quality, logger, logPrefix, processedFiles, dest } =
    options

  return new Transform({
    objectMode: true,
    async transform(file, _enc, cb) {
      if (file._isInvalid) {
        return cb(null, null)
      }

      try {
        const optimizedFile = await optimizeRasterFile(file, {
          targetType,
          quality,
          logger,
          logPrefix,
        })
        markProcessedFile(processedFiles, optimizedFile.path, dest)
        cb(null, optimizedFile)
      } catch (error) {
        logger.error(
          `Image optimization failed for ${path.basename(file.path)}. Cause: ${error.message}. Falling back to original.`
        )
        markProcessedFile(processedFiles, file.path, dest)
        cb(null, file)
      }
    },
  })
}

async function executeRasterTask(options) {
  const {
    src,
    dest,
    targetType,
    logger,
    logPrefix = 'Images',
    quality = 85,
  } = options
  const processedFiles = []

  const pipeline = gulp
    .src(src, { encoding: false })
    .pipe(
      createChangedFilter(dest, {
        extension: `.${targetType}`,
      })
    )
    .pipe(createImageValidationTransform(logger))
    .pipe(
      createRasterOptimizationTransform({
        targetType,
        quality,
        logger,
        logPrefix,
        processedFiles,
        dest,
      })
    )
    .pipe(gulp.dest(dest))

  attachPipelineLogging({
    stream: pipeline,
    loggerInstance: logger,
    trackedFiles: processedFiles,
    successLabel: `[${logPrefix}] Processed assets`,
    emptyMessage: `[${logPrefix}] No new ${targetType.toUpperCase()} needed.`,
    errorMessage: `[${logPrefix}] Error:`,
  })

  try {
    await streamToPromise(pipeline)
  } catch (error) {
    logger.error(
      `[${logPrefix}] Optimization pipeline failed. Cause: ${error.message}`
    )
    throw error
  }
}

const imagePipelineApi = {
  createImageValidationTransform,
  executeRasterTask,
}

export default imagePipelineApi
