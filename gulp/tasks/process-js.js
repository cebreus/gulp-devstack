import { createGulpEsbuild } from 'gulp-esbuild'
import pc from 'picocolors'
import gulp from 'gulp'

import * as defaultConfig from '../config.js'
import {
  attachPipelineLogging,
  getRelativePath,
  streamToPromise,
} from '../utils/helpers.js'
import loggerLib from '../utils/logger.js'

const logger = loggerLib.createLogger('JavaScript')
const gulpEsbuild = createGulpEsbuild()

/**
 * @typedef {object} JsProcessingOptions
 * @property {boolean} [bundle=false] - Whether to bundle all dependencies
 * @property {string} [outputFormat='esm'] - Output module format (esm, iife, cjs)
 * @property {boolean} [minify] - Whether to minify the output
 * @property {boolean} [sourceMaps] - Explicitly enable/disable sourcemaps
 */

/**
 * Generates esbuild configuration object based on options and environment.
 * @param {JsProcessingOptions} options - Task options
 * @param {object} [buildConfig] - Configuration provider
 * @returns {object} Esbuild configuration object
 */
export function getEsbuildConfig(options = {}, buildConfig = defaultConfig) {
  const { bundle = false, outputFormat = 'esm', minify, sourceMaps } = options

  const shouldMinify = minify ?? buildConfig.minifyJs()
  const shouldGenerateSourceMaps = sourceMaps ?? buildConfig.sourceMaps()

  return {
    bundle,
    format: outputFormat,
    minify: shouldMinify,
    sourcemap: shouldGenerateSourceMaps ? 'external' : false,
    loader: { '.js': 'js' },
    target: ['es2022'],
    logLevel: loggerLib.isDebugEnabled() ? 'info' : 'warning',
  }
}

/**
 * Gulp Task: Processes JavaScript source files using esbuild.
 * @param {string|string[]} filePaths - Input glob pattern(s) for JS files
 * @param {string} outputDir - Destination directory
 * @param {JsProcessingOptions} [options] - Task options
 * @returns {Promise<void>} Resolves when processing is complete
 */
export async function processJs(filePaths, outputDir, options = {}) {
  // Input validation
  if (!filePaths || (Array.isArray(filePaths) && filePaths.length === 0)) {
    logger.warn('JS Task: Skipping execution (no valid input files provided).')
    return
  }

  const esbuildConfig = getEsbuildConfig(options)

  logger.debug(
    `Processing JS with esbuild to ${pc.dim(outputDir)} (bundle: ${esbuildConfig.bundle}, minify: ${esbuildConfig.minify})`
  )

  const processedFiles = []
  const jsPipeline = gulp
    .src(filePaths)
    .pipe(gulpEsbuild(esbuildConfig))
    .pipe(gulp.dest(outputDir))

  jsPipeline.on('data', (file) => {
    if (file && file.path) {
      try {
        processedFiles.push(getRelativePath(file.path))
      } catch {
        // Skip extension artifacts
      }
    }
  })

  attachPipelineLogging({
    stream: jsPipeline,
    loggerInstance: logger,
    trackedFiles: processedFiles,
    successLabel: 'JS assets generated',
    emptyMessage: 'No JS assets were generated.',
    errorMessage: 'esbuild processing failed!',
  })

  return streamToPromise(jsPipeline)
}

export default processJs
