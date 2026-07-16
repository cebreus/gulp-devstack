import path from 'node:path'
import { glob } from 'glob'

import loggerLib, { suppressOutdatedBootstrapWarnings } from '../utils/index.js'
import sassPipeline from '../utils/sass-pipeline.js'

const logger = loggerLib.createLogger('Sass')
const scssDiscoveryCache = new Map()
const SCSS_DISCOVERY_CACHE_TTL_MS = 1000
const SHOULD_FAIL_ON_SASS_ERROR = process.env.GULP_FAIL_ON_SASS_ERROR === 'true'
let hasSassCompilationErrors = false

function flattenWrittenFiles(results) {
  return results.flat().filter(Boolean)
}

function hasGlobPattern(filePath) {
  return /[*?[\]{}()!]/u.test(filePath)
}

async function resolveSourceEntries(src) {
  if (Array.isArray(src)) {
    return src
  }

  if (hasGlobPattern(src)) {
    return glob(src)
  }

  return [src]
}

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
    includePaths: [
      ...buildSassIncludePaths(null, config),
      ...(customSassOptions.includePaths || []).map((entry) =>
        path.resolve(entry)
      ),
    ],
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
  if (cached && cached.expiresAt > now) {
    return cached.files
  }

  const files = await globFn(pattern)
  scssDiscoveryCache.set(pattern, { files, expiresAt: now + ttlMs })
  return files
}

async function buildSassPipeline(
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
  const postcss = (await import('postcss')).default
  const sass = await import('sass')
  const sassCompilerOptions = getSassCompilerOptions(
    customSassOptions,
    minify,
    config
  )
  return sassPipeline.createSassPipeline({
    config,
    src,
    dest,
    base,
    outputFilename,
    postcssPlugins,
    sourceMaps,
    minify,
    beautify,
    skipNewer,
    skipIntegrity,
    sassCompilerOptions,
    logger,
    markCompilationError() {
      hasSassCompilationErrors = true
    },
    autoprefixer,
    cssnano,
    postcss,
    sass,
  })
}

/**
 * Promisified SASS processing.
 * @param {object} config - Configuration object
 * @param {string|string[]} src - Source files
 * @param {string} dest - Destination directory
 * @param {object} [options] - Additional options
 * @param {string|null} [options.outputFilename] - Optional output name
 * @param {import('postcss').AcceptedPlugin[]} [options.postcssPlugins] - PostCSS plugins
 * @returns {Promise<void>}
 */
export default async function processSass(config, src, dest, options = {}) {
  const { outputFilename = null, postcssPlugins = [] } = options
  const sourceEntries = await resolveSourceEntries(src)
  return buildSassPipeline(config, {
    src: sourceEntries,
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
}

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
    if (sourceEntries.length === 0) {
      return
    }

    return processSass(config, sourceEntries, dest, {
      ...options,
      outputFilename,
      postcssPlugins,
      base: sourceDir,
      sassOptions: {
        includePaths: buildSassIncludePaths(sourceDir, config),
        ...(options.sassOptions || {}),
      },
    })
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
 * @param {object} [options] - Additional options
 * @returns {Promise<void>}
 */
export function compileRouteStyles(config, postcssPlugins = [], options = {}) {
  return compileScssGroup(config, {
    sourceDir: config.routesBase,
    dest: config.paths.sass,
    loggerContext: 'Routes',
    postcssPlugins,
    options,
  })
}

function buildModeStyleOptions(config, mode, overrides = {}) {
  return {
    sourceMaps: mode === 'dev' ? config.sourceMaps : false,
    minify: mode === 'build' ? config.minifyCss : false,
    skipNewer: mode === 'dev',
    ...overrides,
  }
}

/**
 * Compiles the project Bootstrap bundle from local SCSS variables.
 * @param {object} config - Configuration object
 * @param {'dev'|'build'|'export'} mode - Build mode
 * @returns {Promise<void>}
 */
export function compileBootstrapStyles(config, mode) {
  return processSass(config, config.sassBootstrap, config.paths.sass, {
    ...buildModeStyleOptions(config, mode),
    outputFilename: 'bootstrap.css',
  })
}

/**
 * Compiles global project style bundles.
 * @param {object} config - Configuration object
 * @param {'dev'|'build'|'export'} mode - Build mode
 * @returns {Promise<void>}
 */
export async function compileProjectStyles(config, mode) {
  const options = buildModeStyleOptions(config, mode)

  const results = await Promise.all([
    processSass(config, config.sassCustom, config.paths.sass, {
      ...options,
      outputFilename: 'custom.css',
    }),
    processSass(config, config.sassComponents, config.paths.sass, {
      ...options,
      outputFilename: 'components.css',
      skipIntegrity: true,
    }),
  ])
  return flattenWrittenFiles(results)
}

/**
 * Orchestrates SASS processing based on build mode.
 * @param {object} config - Configuration object
 * @param {string} config.sassBootstrap - Path to project Bootstrap SASS file
 * @param {string} config.sassCustom - Path to custom SASS file
 * @param {string} config.sassComponents - Path to component SASS file
 * @param {string} config.routesBase - Path to routes
 * @param {boolean} config.minifyCss - Global minify flag
 * @param {boolean} config.sourceMaps - Global sourcemaps flag
 * @param {object} config.paths - Path mapping
 * @param {string} config.paths.sass - Destination for compiled CSS
 * @param {'dev'|'build'|'export'} mode - Build mode
 * @returns {Promise<void>}
 */
export async function processAllSass(config, mode) {
  hasSassCompilationErrors = false

  try {
    const results = await Promise.all([
      compileBootstrapStyles(config, mode),
      compileProjectStyles(config, mode),
      compileRouteStyles(config, [], buildModeStyleOptions(config, mode)),
    ])

    if (
      hasSassCompilationErrors &&
      (mode !== 'dev' || SHOULD_FAIL_ON_SASS_ERROR)
    ) {
      throw new Error(
        'Sass compilation failed. Enable logs to inspect root causes.'
      )
    }

    return flattenWrittenFiles(results)
  } catch (error) {
    logger.error(`Failed to process Sass in ${mode} mode: ${error.message}`)
    throw error
  }
}
