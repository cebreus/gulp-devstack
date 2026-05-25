import path from 'node:path'
import { Transform } from 'node:stream'
import { glob } from 'glob'
import pc from 'picocolors'
import gulp from 'gulp'

import loggerLib, {
  ensureFileIntegrity,
  isPrivateFile,
  streamToPromise,
  suppressOutdatedBootstrapWarnings,
} from '../utils/index.js'

const logger = loggerLib.createLogger('Sass')
const scssDiscoveryCache = new Map()
const SCSS_DISCOVERY_CACHE_TTL_MS = 1000
const SHOULD_FAIL_ON_SASS_ERROR = process.env.GULP_FAIL_ON_SASS_ERROR === 'true'
let hasSassCompilationErrors = false

/**
 * Builds standard SASS include paths.
 * @param {string|null} [extraPath] - Optional additional path to include
 * @param {object} config - Configuration object containing sassBase
 * @returns {string[]} Resolved include paths
 */
export function buildSassIncludePaths(extraPath, config) {
  return [
    path.resolve('./src'),
    path.resolve(config.sassBase),
    path.resolve('./'),
    path.resolve('./node_modules'),
    ...(extraPath ? [path.resolve(extraPath)] : []),
  ]
}

/**
 * Generates options for the SASS compiler.
 * @param {object} [customSassOptions] - Overrides for sass options
 * @param {boolean} [minify] - Whether to use compressed output
 * @param {object} config - Configuration object
 * @returns {object} Sass compiler options
 */
export function getSassCompilerOptions(
  customSassOptions = {},
  minify = false,
  config
) {
  return {
    quietDeps: true,
    silenceDeprecations: [
      'import',
      'slash-div',
      'color-functions',
      'global-variable-shadowing',
    ],
    outputStyle: minify ? 'compressed' : 'expanded',
    ...customSassOptions,
    includePaths: buildSassIncludePaths(
      customSassOptions.includePaths?.[0],
      config
    ),
    logger: {
      warn: (message, options) => {
        if (!suppressOutdatedBootstrapWarnings(message)) {
          logger.warn(message, options)
        }
      },
      debug: () => {},
    },
  }
}

/**
 * Clears the in-memory SCSS discovery cache.
 * @returns {void}
 */
export function clearScssDiscoveryCache() {
  scssDiscoveryCache.clear()
}

/**
 * Discovers SCSS source files with caching.
 * @param {string} sourceDir - Directory to scan
 * @param {object} [options] - Discovery options
 * @returns {Promise<string[]>} List of found files
 */
export async function discoverScssSources(sourceDir, options = {}) {
  const pattern = path.join(sourceDir, '**/*.scss').replace(/\\/g, '/')
  const ttlMs = options.ttlMs ?? SCSS_DISCOVERY_CACHE_TTL_MS
  const now = options.now ? options.now() : Date.now()
  const globFn = options.globFn || glob

  const cached = scssDiscoveryCache.get(pattern)
  if (cached && cached.expiresAt > now) return cached.files

  const files = await globFn(pattern)
  scssDiscoveryCache.set(pattern, { files, expiresAt: now + ttlMs })
  return files
}

/**
 * Filters out empty files from the stream to prevent integrity failures
 * and avoid deploying useless empty assets.
 * @returns {import('node:stream').Transform} A transform stream
 */
function dropEmptyFiles() {
  return new Transform({
    objectMode: true,
    transform(file, _enc, cb) {
      if (file.contents && file.contents.length === 0) {
        return cb(null, null)
      }
      cb(null, file)
    },
  })
}

/**
 * Builds a SASS compilation pipeline.
 * @param {object} config - Configuration object
 * @param {object} params - Pipeline parameters
 * @param {string|string[]} params.src - Source files
 * @param {string} params.dest - Destination directory
 * @param {string|null} params.outputFilename - Optional output name
 * @param {import('postcss').AcceptedPlugin[]} [params.postcssPlugins] - PostCSS plugins
 * @param {object} [params.sassOptions] - Custom sass options
 * @param {boolean} [params.sourceMaps] - Source maps flag
 * @param {boolean} [params.minify] - Minification flag
 * @param {boolean} [params.beautify] - Beautification flag
 * @param {string} [params.base] - Base directory for preserving hierarchy
 * @param {boolean} [params.skipNewer] - Skip newer check flag
 * @param {boolean} [params.skipIntegrity] - Skip integrity check flag
 * @returns {Promise<import('node:stream').ReadWriteStream>} Gulp stream
 */
export async function buildSassPipeline(
  config,
  {
    src,
    dest,
    base,
    outputFilename,
    postcssPlugins = [],
    sassOptions: customSassOptions = {},
    sourceMaps = false,
    minify = false,
    beautify = false,
    skipNewer = false,
    skipIntegrity = false,
  }
) {
  const { default: autoprefixer } = await import('autoprefixer')
  const { default: cssnano } = await import('cssnano')
  const { default: concat } = await import('gulp-concat')
  const { default: prettify } = await import('gulp-jsbeautifier')
  const { default: newer } = await import('gulp-newer')
  const { default: postcss } = await import('gulp-postcss')
  const { default: gulpSass } = await import('gulp-sass')
  const { default: sourcemaps } = await import('gulp-sourcemaps')
  const sass = await import('sass')

  const sassCompiler = gulpSass(sass)

  const finalPostcssPlugins = [autoprefixer(), ...postcssPlugins]
  if (minify) finalPostcssPlugins.push(cssnano())

  const sassCompilerOptions = getSassCompilerOptions(
    customSassOptions,
    minify,
    config
  )

  let pipeline = gulp.src(src, { allowEmpty: true, base }).pipe(
    new Transform({
      objectMode: true,
      transform(file, _enc, cb) {
        if (isPrivateFile(file.path)) return cb(null, null)
        cb(null, file)
      },
    })
  )

  if (!skipNewer) {
    if (outputFilename) {
      pipeline = pipeline.pipe(newer(path.join(dest, outputFilename)))
    } else {
      pipeline = pipeline.pipe(newer({ dest, ext: '.css' }))
    }
  }

  if (sourceMaps) pipeline = pipeline.pipe(sourcemaps.init())

  pipeline = pipeline.pipe(
    sassCompiler(sassCompilerOptions).on('error', function (error) {
      if (suppressOutdatedBootstrapWarnings(error.message || error)) {
        this.emit('end')
        return
      }
      const message = `Sass compilation failed in ${error.file || 'unknown'}. Cause: ${error.message}`
      logger.error(message)
      hasSassCompilationErrors = true
      this.emit('end')
    })
  )
  pipeline = pipeline.pipe(dropEmptyFiles())
  pipeline = pipeline.pipe(
    ensureFileIntegrity({
      taskName: 'Sass',
      minSize: 10,
      skipIntegrity: skipIntegrity || config.skipIntegrity || false,
    })
  )

  pipeline = pipeline.pipe(postcss(finalPostcssPlugins))
  if (outputFilename) pipeline = pipeline.pipe(concat(outputFilename))

  if (minify) {
    pipeline = pipeline.pipe(
      new Transform({
        objectMode: true,
        transform(file, _enc, cb) {
          if (!file.basename.includes('.min.')) {
            file.extname = `.min${file.extname}`
          }
          cb(null, file)
        },
      })
    )
  }

  if (beautify && !minify) {
    pipeline = pipeline.pipe(prettify({ indent_size: 4 }))
  }

  if (sourceMaps) pipeline = pipeline.pipe(sourcemaps.write('./maps'))

  return pipeline.pipe(gulp.dest(dest)).on('end', () => {
    logger.info(
      `Saved: ${pc.yellow(outputFilename || 'Styles')} to ${pc.dim(dest)}`
    )
  })
}

/**
 * Promisified SASS processing.
 * @param {object} config - Configuration object
 * @param {string|string[]} src - Source files
 * @param {string} dest - Destination directory
 * @param {string|null} outputFilename - Optional output name
 * @param {import('postcss').AcceptedPlugin[]} [postcssPlugins] - PostCSS plugins
 * @param {object} [options] - Additional options
 * @returns {Promise<void>}
 */
export async function processSass(
  config,
  src,
  dest,
  outputFilename,
  postcssPlugins = [],
  options = {}
) {
  const pipeline = await buildSassPipeline(config, {
    src,
    dest,
    base: options.base,
    outputFilename,
    postcssPlugins,
    sassOptions: options.sassOptions || {},
    sourceMaps: options.sourceMaps ?? config.sourceMaps,
    minify: options.minify ?? config.minifyCss,
    beautify: options.beautify ?? config.formatCode,
    skipNewer: options.skipNewer || false,
    skipIntegrity: options.skipIntegrity || false,
  })
  return streamToPromise(pipeline)
}

/**
 * Compiles a group of SCSS files.
 * @param {object} config - Configuration object
 * @param {object} params - Group parameters
 * @param {string} params.sourceDir - Source directory
 * @param {string} params.dest - Destination directory
 * @param {string|null} [params.outputFilename] - Optional output name
 * @param {string} [params.loggerContext] - Log context
 * @param {import('postcss').AcceptedPlugin[]} [params.postcssPlugins] - PostCSS plugins
 * @param {object} [params.options] - Additional options
 * @returns {Promise<void>}
 */
async function compileScssGroup(
  config,
  {
    sourceDir,
    dest,
    outputFilename = null,
    loggerContext = 'SCSS Group',
    postcssPlugins = [],
    options = {},
  }
) {
  try {
    const sourceEntries = await discoverScssSources(sourceDir)
    if (sourceEntries.length === 0) return

    return processSass(
      config,
      sourceEntries,
      dest,
      outputFilename,
      postcssPlugins,
      {
        ...options,
        base: sourceDir,
        loggerContext,
        sassOptions: {
          includePaths: buildSassIncludePaths(sourceDir, config),
          ...(options.sassOptions || {}),
        },
      }
    )
  } catch (error) {
    logger.error(
      `Failed to compile SCSS group (${loggerContext}): ${error.message}`
    )
    throw error
  }
}

/**
 * Compiles route-specific styles.
 * @param {object} config - Configuration object
 * @param {import('postcss').AcceptedPlugin[]} [postcssPlugins] - PostCSS plugins
 * @returns {Promise<void>}
 */
export function compileRouteStyles(config, postcssPlugins = []) {
  return compileScssGroup(config, {
    sourceDir: config.routesBase,
    dest: config.paths.sass,
    loggerContext: 'Routes',
    postcssPlugins,
  })
}

/**
 * Returns core PostCSS plugins.
 * @returns {Promise<import('postcss').AcceptedPlugin[]>} List of plugins
 */
export async function getCorePostcssPlugins() {
  const { default: autoprefixer } = await import('autoprefixer')
  return [autoprefixer()]
}

/**
 * Orchestrates SASS processing based on build mode.
 * @param {object} config - Configuration object
 * @param {string} config.sassCustom - Path to custom SASS file
 * @param {string} config.sassHeader - Path to header SASS file
 * @param {string} config.sassHero - Path to hero SASS file
 * @param {string} config.bootstrapCssSource - Bootstrap CSS source path
 * @param {string} config.bootstrapCssMin - Minified Bootstrap CSS source path
 * @param {string} config.routesBase - Path to routes
 * @param {boolean} config.minifyCss - Global minify flag
 * @param {boolean} config.sourceMaps - Global sourcemaps flag
 * @param {object} config.paths - Path mapping
 * @param {string} config.paths.sass - Destination for compiled CSS
 * @param {'dev'|'build'|'export'} mode - Build mode
 * @returns {Promise<void>}
 */
export async function processAllSass(config, mode) {
  const corePostcssPlugins = await getCorePostcssPlugins()
  hasSassCompilationErrors = false

  const bootstrapSource =
    mode === 'build' ? config.bootstrapCssMin : config.bootstrapCssSource

  /**
   * Copies the prebuilt Bootstrap layer selected for the current mode.
   * @returns {Promise<import('node:stream').Stream>} Completed stream
   */
  function copyBootstrapCss() {
    const stream = gulp
      .src(bootstrapSource, { allowEmpty: false })
      .pipe(gulp.dest(config.paths.sass))
    return streamToPromise(stream)
  }

  /**
   * Compiles project-wide custom tokens and utility overrides.
   * @returns {Promise<void>}
   */
  function bundleCustomStyles() {
    return processSass(
      config,
      config.sassCustom,
      config.paths.sass,
      'custom.css',
      corePostcssPlugins,
      {
        sourceMaps: mode === 'dev' ? config.sourceMaps : false,
        minify: mode === 'build' ? config.minifyCss : false,
        skipNewer: mode === 'dev',
      }
    )
  }

  /**
   * Compiles the hero component into a dedicated global bundle.
   * @returns {Promise<void>}
   */
  function bundleHeroStyles() {
    return processSass(
      config,
      config.sassHero,
      config.paths.sass,
      'hero.css',
      corePostcssPlugins,
      {
        sourceMaps: mode === 'dev' ? config.sourceMaps : false,
        minify: mode === 'build' ? config.minifyCss : false,
        skipNewer: mode === 'dev',
      }
    )
  }

  /**
   * Compiles the header component into a dedicated global bundle.
   * @returns {Promise<void>}
   */
  function bundleHeaderStyles() {
    return processSass(
      config,
      config.sassHeader,
      config.paths.sass,
      'header.css',
      corePostcssPlugins,
      {
        sourceMaps: mode === 'dev' ? config.sourceMaps : false,
        minify: mode === 'build' ? config.minifyCss : false,
        skipNewer: mode === 'dev',
      }
    )
  }

  /**
   * Compiles page-local route styles while preserving route hierarchy.
   * @returns {Promise<void>}
   */
  function bundleRouteStyles() {
    return compileRouteStyles(config, corePostcssPlugins)
  }

  try {
    await gulp.parallel(
      copyBootstrapCss,
      bundleCustomStyles,
      bundleHeaderStyles,
      bundleHeroStyles,
      bundleRouteStyles
    )()

    if (SHOULD_FAIL_ON_SASS_ERROR && hasSassCompilationErrors) {
      throw new Error(
        'Sass compilation failed. Enable logs to inspect root causes.'
      )
    }
  } catch (error) {
    logger.error(`Failed to process Sass in ${mode} mode: ${error.message}`)
    throw error
  }
}

export default processSass
