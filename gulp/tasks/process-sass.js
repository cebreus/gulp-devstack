import path from 'node:path'
import autoprefixer from 'autoprefixer'
import cssnano from 'cssnano'
import { glob } from 'glob'
import concat from 'gulp-concat'
import prettify from 'gulp-jsbeautifier'
import postcss from 'gulp-postcss'
import replace from 'gulp-replace'
import gulpSass from 'gulp-sass'
import sourcemaps from 'gulp-sourcemaps'
import pc from 'picocolors'
import * as sass from 'sass'
import gulp from 'gulp'

import * as defaultConfig from '../config.js'
import {
  streamToPromise,
  suppressOutdatedBootstrapWarnings,
} from '../utils/helpers.js'
import loggerLib from '../utils/logger.js'

const sassCompiler = gulpSass(sass)
const logger = loggerLib.createLogger('Sass')

/**
 * Matches the prelude of a SCSS file:
 * - line comments  (//)
 * - block comments (/* ... *\/)
 * - @use / @forward directives
 * Captures everything before the first real rule.
 */
const SASS_PRELUDE_REGEX =
  /^\s*(?:(?:\/\/[^\r\n]*|\/\*[\s\S]*?\*\/|@(?:use|forward)\s[^;]+;)\s*)*/

/**
 * Builds standard SASS include paths.
 * @param {string} [extraPath] - Optional additional path to include
 * @param {object} [buildConfig] - Configuration provider
 * @returns {string[]} Resolved include paths
 */
export function buildSassIncludePaths(extraPath, buildConfig = defaultConfig) {
  return [
    path.resolve('./src'),
    path.resolve(buildConfig.sassBase),
    path.resolve('./'),
    path.resolve('./node_modules'),
    ...(extraPath ? [path.resolve(extraPath)] : []),
  ]
}

/**
 * Generates options for the SASS compiler.
 * @param {object} customSassOptions - Overrides
 * @param {boolean} minify - Minification flag
 * @param {object} [buildConfig] - Configuration provider
 * @returns {object} Sass compiler options
 */
export function getSassCompilerOptions(
  customSassOptions = {},
  minify = false,
  buildConfig = defaultConfig
) {
  return {
    quietDeps: true,
    outputStyle: minify ? 'compressed' : 'expanded',
    ...customSassOptions,
    includePaths: buildSassIncludePaths(
      customSassOptions.includePaths?.[0],
      buildConfig
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
 * Builds a Gulp pipeline for SASS compilation.
 * @param {object} options - Configuration options
 * @param {string|string[]} options.src - Source files to compile
 * @param {string} options.dest - Destination directory
 * @param {string|null} [options.outputFilename] - Name of the output file (if concatenating)
 * @param {import('postcss').AcceptedPlugin[]} [options.postcssPlugins] - PostCSS plugins to use
 * @param {object} [options.sassOptions] - Options for the Sass compiler
 * @param {boolean} [options.sourceMaps] - Whether to generate source maps
 * @param {boolean} [options.minify] - Whether to minify the output
 * @param {boolean} [options.beautify] - Whether to beautify the output
 * @param {string} [options.loggerContext] - Context name for logs
 * @returns {import('node:stream').ReadWriteStream} The Gulp stream to handle.
 */
export function buildSassPipeline({
  src,
  dest,
  outputFilename,
  postcssPlugins = [],
  sassOptions: customSassOptions = {},
  sourceMaps = false,
  minify = false,
  beautify = false,
  loggerContext = '[SASS]',
}) {
  const finalPostcssPlugins = postcssPlugins.length
    ? [...postcssPlugins]
    : [autoprefixer()]

  if (minify) {
    finalPostcssPlugins.push(cssnano())
  }

  const sassCompilerOptions = getSassCompilerOptions(customSassOptions, minify)

  // Log only the source if it's a simple string, otherwise represent the glob
  const logIn = typeof src === 'string' ? src : 'Multiple files'
  const logOut = outputFilename || 'Original names'
  logger.verbose(`Compilation: ${logIn} -> ${logOut}`)

  let pipeline = gulp.src(src, { allowEmpty: true })

  // Auto-prepend global configuration (@use/forward must be first)
  pipeline = pipeline.pipe(
    replace(SASS_PRELUDE_REGEX, function (match) {
      const content = this.file.contents ? this.file.contents.toString() : ''
      const isComponent = this.file.path.includes('/components/')
      const isGlobals =
        content.includes('globals') || this.file.path.endsWith('_globals.scss')

      let prelude = match

      const componentsBase = path
        .resolve(defaultConfig.sassBase, '_components.scss')
        .replace(/\\/g, '/')
      const globalsBase = path
        .resolve(defaultConfig.sassBase, '_globals.scss')
        .replace(/\\/g, '/')

      if (!isGlobals && !content.includes('_globals.scss')) {
        if (isComponent) {
          // Individual components only need globals
          prelude += `@import "${globalsBase}";\n`
        } else if (!content.includes('_components.scss')) {
          // Routes/Utilities get the full library (which carries globals)
          prelude += `@import "${componentsBase}";\n`
        }
      }
      return prelude
    })
  )

  if (sourceMaps) {
    pipeline = pipeline.pipe(sourcemaps.init())
  }

  pipeline = pipeline.pipe(
    sassCompiler(sassCompilerOptions).on('error', function (error) {
      if (suppressOutdatedBootstrapWarnings(error.message || error)) {
        this.emit('end')
        return
      }
      logger.error(
        `${loggerContext} Compilation Error: ${this.file?.relative || 'File'}`,
        error.message || error
      )
      this.emit('end')
    })
  )

  pipeline = pipeline.pipe(postcss(finalPostcssPlugins))

  if (outputFilename) {
    pipeline = pipeline.pipe(concat(outputFilename))
  }

  if (beautify && !minify) {
    pipeline = pipeline.pipe(prettify({ indent_size: 4 }))
  }

  if (sourceMaps) {
    pipeline = pipeline.pipe(sourcemaps.write('./maps'))
  }

  pipeline = pipeline.pipe(gulp.dest(dest))

  return pipeline.on('end', () => {
    const assetName = outputFilename || 'Route/Component styles'
    const isDebug = loggerLib.isDebugEnabled()

    let reportMsg = `Saved: ${pc.yellow(assetName)}`

    if (isDebug) {
      if (outputFilename) {
        reportMsg = `Saved: ${pc.yellow(path.join(dest, outputFilename))}`
      } else {
        reportMsg = `Saved: ${pc.yellow(assetName)} to ${pc.dim(dest)}`
      }
    }

    logger.info(reportMsg)
  })
}

/**
 * Promisified SASS processing for Gulp tasks.
 * @param {string|string[]} src - Source files
 * @param {string} dest - Destination directory
 * @param {string|null} outputFilename - Optional output filename
 * @param {import('postcss').AcceptedPlugin[]} [postcssPlugins] - PostCSS plugins
 * @param {object} [options] - Additional options
 * @returns {Promise<void>}
 */
export async function processSass(
  src,
  dest,
  outputFilename,
  postcssPlugins = [],
  options = {}
) {
  const pipeline = buildSassPipeline({
    src,
    dest,
    outputFilename,
    postcssPlugins,
    sassOptions: options.sassOptions || {},
    sourceMaps: options.sourceMaps ?? defaultConfig.sourceMaps(),
    minify: options.minify ?? defaultConfig.minifyCss(),
    beautify: options.beautify ?? defaultConfig.formatCode(),
    loggerContext: options.loggerContext || '[SASS]',
  })
  return streamToPromise(pipeline)
}

/**
 * Compiles SCSS files matching a pattern into the target directory.
 * @param {object} options - Compilation options
 * @param {string} options.sourceDir - Directory to scan for .scss files
 * @param {string} options.dest - Output directory
 * @param {string|null} [options.outputFilename] - Output filename (null = keep originals)
 * @param {string} [options.loggerContext] - Log prefix
 * @param {object} [options.options] - Additional processSass options
 * @returns {Promise<void>}
 */
async function compileScssGroup({
  sourceDir,
  dest,
  outputFilename = null,
  loggerContext = '[SCSS]',
  options = {},
}) {
  try {
    const pattern = path.join(sourceDir, '**/*.scss').replace(/\\/g, '/')
    const files = await glob(pattern)
    if (files.length === 0) return

    return processSass(
      pattern,
      dest,
      outputFilename,
      defaultConfig.postcssPluginsBase(),
      {
        ...options,
        loggerContext,
        sassOptions: {
          includePaths: buildSassIncludePaths(sourceDir),
          ...(options.sassOptions || {}),
        },
      }
    )
  } catch (error) {
    logger.error(`${loggerContext} Failure:`, error)
  }
}

/**
 * Compiles all component styles.
 * @returns {Promise<void>}
 */
export function compileAllComponentStyles() {
  return compileScssGroup({
    sourceDir: defaultConfig.componentsPath,
    dest: defaultConfig.sassBuild(),
    outputFilename: 'components.css',
    loggerContext: '[Components]',
  })
}

/**
 * Compiles all route-specific SCSS files.
 * @returns {Promise<void>}
 */
export function compileRouteStyles() {
  return compileScssGroup({
    sourceDir: defaultConfig.routesBase,
    dest: defaultConfig.sassBuild(),
    loggerContext: '[Routes]',
  })
}

/**
 * Compiles component styles natively, producing isolated CSS files mirroring the source directory structure.
 * Ideal for transparent CMS handoffs (export mode).
 * @returns {Promise<void>}
 */
export function compileIsolatedComponentStyles() {
  return compileScssGroup({
    sourceDir: defaultConfig.componentsPath,
    dest: `${defaultConfig.sassBuild()}/components`,
    loggerContext: '[Components Isolated]',
  })
}

export default processSass
