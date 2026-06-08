import path from 'node:path'
import { Transform } from 'node:stream'
import { glob } from 'glob'
import pc from 'picocolors'
import gulp from 'gulp'

import createChangedFilter from '../utils/changed-filter.js'
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
  const {
    bundle = false,
    outputFormat = 'esm',
    minify,
    sourceMaps,
    entryPoints,
  } = options

  const shouldMinify = minify ?? buildConfig.minifyJs
  const shouldGenerateSourceMaps = sourceMaps ?? buildConfig.sourceMaps

  const result = {
    bundle,
    format: outputFormat,
    minify: shouldMinify,
    sourcemap: shouldGenerateSourceMaps ? 'external' : false,
    loader: { '.js': 'js' },
    target: ['es2022'],
    logLevel: loggerLib.isDebugEnabled() ? 'info' : 'warning',
  }

  if (entryPoints) {
    result.entryPoints = entryPoints
  }

  return result
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
 * @param {string} [options.base] - Base directory used to preserve route structure
 * @param {string} [options.cwd] - Working directory for resolving relative globs
 * @returns {Promise<void>} Resolves when processing is complete
 */
export default async function processJs(
  config,
  filePaths,
  outputDir,
  options = {}
) {
  if (!filePaths || (Array.isArray(filePaths) && filePaths.length === 0)) {
    logger.warn(
      'Skipping JS processing: no valid input files provided. Check task globs or route-level script entries.'
    )
    return
  }

  const srcOptions = {
    ...(options.base && { base: options.base }),
    ...(options.cwd && { cwd: options.cwd }),
  }

  const resolvedEntryPoints = await glob(filePaths, srcOptions)

  if (resolvedEntryPoints.length === 0) {
    logger.debug('No files matched for JS processing, skipping esbuild.')
    return
  }

  const gulpEsbuild = (await import('gulp-esbuild')).createGulpEsbuild()
  const esbuildConfig = getEsbuildConfig(
    { ...options, entryPoints: resolvedEntryPoints },
    config
  )
  logger.debug(
    `Processing JS with esbuild to ${pc.dim(outputDir)} (bundle: ${esbuildConfig.bundle}, minify: ${esbuildConfig.minify})`
  )

  const processedFiles = []
  const jsPipeline = gulp
    .src(filePaths, srcOptions)
    .pipe(
      createChangedFilter(outputDir, {
        extension: esbuildConfig.minify ? '.min.js' : '.js',
      })
    )
    .pipe(
      new Transform({
        objectMode: true,
        transform(file, _enc, cb) {
          if (isPrivateFile(file.path)) {
            return cb(null, null)
          }
          cb(null, file)
        },
      })
    )
    .pipe(gulpEsbuild(esbuildConfig))
    .pipe(createMinRenameTransform(esbuildConfig.minify))
    .pipe(gulp.dest(outputDir))

  jsPipeline.on('data', (file) => {
    if (file && file.path) {
      processedFiles.push(getRelativePath(file.path))
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
}

/**
 * Processes both global and route-level JavaScript sources.
 * @param {object} config - Configuration object
 * @param {string} config.jsFiles - Glob for global JS entrypoints
 * @param {string} config.routesBase - Base directory for route-local sources
 * @param {string} config.paths.js - Destination directory for compiled JS
 * @param {boolean} config.concatFiles - Whether to bundle entrypoints
 * @param {boolean} config.minifyJs - Whether to minify JS
 * @param {boolean} config.sourceMaps - Whether to emit sourcemaps
 * @returns {Promise<void>} Resolves when all JS assets are processed
 */
export async function processAllJs(config) {
  const sharedOptions = {
    bundle: config.concatFiles,
    minify: config.minifyJs,
    sourceMaps: config.sourceMaps,
  }
  const routeScriptFiles = await glob(
    path.join(config.routesBase, '**/*.js').replace(/\\/g, '/')
  )
  const routeTasks = routeScriptFiles.map(async (routeFilePath) => {
    const routeRelativeDirectory = path.dirname(
      path.relative(config.routesBase, routeFilePath)
    )
    const destinationDirectory =
      routeRelativeDirectory === '.'
        ? config.paths.js
        : path.join(config.paths.js, routeRelativeDirectory)

    return processJs(config, routeFilePath, destinationDirectory, sharedOptions)
  })

  await Promise.all([
    processJs(config, config.jsFiles, config.paths.js, sharedOptions),
    ...routeTasks,
  ])
}

/**
 * Creates a transform stream to handle .min extension for minified files.
 * @param {boolean} shouldMinify - Whether minification is enabled
 * @returns {Transform} Gulp transform stream
 */
function createMinRenameTransform(shouldMinify) {
  return new Transform({
    objectMode: true,
    transform(file, _enc, cb) {
      const isSourceMap = file.basename.endsWith('.js.map')

      if (shouldMinify && !isSourceMap && !file.basename.includes('.min.')) {
        file.extname = `.min${file.extname}`
      }
      cb(null, file)
    },
  })
}
