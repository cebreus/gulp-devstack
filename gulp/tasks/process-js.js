import { Transform } from 'node:stream'
import newer from 'gulp-newer'
import pc from 'picocolors'
import gulp from 'gulp'

import loggerLib, {
  attachPipelineLogging,
  getRelativePath,
  isPrivateFile,
  streamToPromise,
} from '../utils/index.js'

const logger = loggerLib.createLogger('ProcessJs')

/**
 * Generates esbuild configuration object based on options and environment.
 * @param {object} options - Task options
 * @param {boolean} [options.bundle] - Whether to bundle all dependencies
 * @param {string} [options.outputFormat] - Output module format (esm, iife, cjs)
 * @param {boolean} [options.minify] - Whether to minify the output
 * @param {boolean} [options.sourceMaps] - Explicitly enable/disable sourcemaps
 * @param {object} [buildConfig] - Configuration provider
 * @returns {object} Esbuild configuration object
 */
export function getEsbuildConfig(options = {}, buildConfig) {
  const { bundle = false, outputFormat = 'esm', minify, sourceMaps } = options

  const shouldMinify = minify ?? buildConfig.minifyJs
  const shouldGenerateSourceMaps = sourceMaps ?? buildConfig.sourceMaps

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
 * @param {object} config - Configuration object
 * @param {boolean} config.minifyJs - Global minify flag
 * @param {boolean} config.sourceMaps - Global sourcemaps flag
 * @param {string|string[]} filePaths - Input glob pattern(s) for JS files
 * @param {string} outputDir - Destination directory
 * @param {object} [options] - Task options
 * @param {boolean} [options.bundle] - Whether to bundle all dependencies
 * @param {string} [options.outputFormat] - Output module format (esm, iife, cjs)
 * @param {boolean} [options.minify] - Whether to minify the output
 * @param {boolean} [options.sourceMaps] - Explicitly enable/disable sourcemaps
 * @returns {Promise<void>} Resolves when processing is complete
 */
export async function processJs(config, filePaths, outputDir, options = {}) {
  if (!filePaths || (Array.isArray(filePaths) && filePaths.length === 0)) {
    logger.warn(
      'Skipping JS processing: no valid input files provided. Check task globs or route-level script entries.'
    )
    return
  }

  const mod = await import('gulp-esbuild')
  const createGulpEsbuild =
    mod.createGulpEsbuild ||
    (mod.default && mod.default.createGulpEsbuild) ||
    mod.default

  if (typeof createGulpEsbuild !== 'function') {
    throw new Error(
      'Failed to load createGulpEsbuild from gulp-esbuild. Check module format.'
    )
  }

  const gulpEsbuild = createGulpEsbuild()

  const esbuildConfig = getEsbuildConfig(options, config)

  logger.debug(
    `Processing JS with esbuild to ${pc.dim(outputDir)} (bundle: ${esbuildConfig.bundle}, minify: ${esbuildConfig.minify})`
  )

  const processedFiles = []
  const jsPipeline = gulp
    .src(filePaths)
    .pipe(newer(outputDir))
    .pipe(
      new Transform({
        objectMode: true,
        transform(file, _enc, cb) {
          if (isPrivateFile(file.path)) return cb(null, null)
          cb(null, file)
        },
      })
    )
    .pipe(gulpEsbuild(esbuildConfig))
    .pipe(
      new Transform({
        objectMode: true,
        transform(file, _enc, cb) {
          if (esbuildConfig.minify && !file.basename.includes('.min.')) {
            file.extname = `.min${file.extname}`
          }
          cb(null, file)
        },
      })
    )
    .pipe(gulp.dest(outputDir))

  jsPipeline.on('data', (file) => {
    if (file && file.path) {
      try {
        processedFiles.push(getRelativePath(file.path))
      } catch {}
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

  await streamToPromise(jsPipeline)

  // Cleanup now handled globally at the end of the build pipeline
}

export default processJs
