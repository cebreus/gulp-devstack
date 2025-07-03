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
    includePaths: [
      ...(customSassOptions.includePaths || []),
      path.resolve(buildConfig.sassBase),
      path.resolve('./src'),
      path.resolve('./'),
      path.resolve('./node_modules'),
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
  const SASS_PRELUDE_REGEX =
    /^\s*(?:(?:\/\/[^\r\n]*|\/\*[\s\S]*?\*\/|@(?:use|forward)\s[^;]+;)\s*)*/
  pipeline = pipeline.pipe(
    replace(SASS_PRELUDE_REGEX, function (match) {
      const content = this.file.contents ? this.file.contents.toString() : ''
      if (
        content.includes('globals') ||
        this.file.path.endsWith('_globals.scss')
      ) {
        return match
      }
      const globalsPath = path
        .resolve(defaultConfig.sassBase, '_globals.scss')
        .replace(/\\/g, '/')
      return `${match}@use "${globalsPath}" as *;\n`
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
    loggerContext: '[SASS]',
  })
  return streamToPromise(pipeline)
}

/**
 * Compiles all component styles.
 * @returns {Promise<void>}
 */
export async function compileAllComponentStyles() {
  try {
    const componentScssPattern = path
      .join(defaultConfig.componentsPath, '**/*.scss')
      .replace(/\\/g, '/')

    // We process components in a stream to allow the auto-prepend logic
    // to act on each file individually before they are joined.
    const pipeline = buildSassPipeline({
      src: componentScssPattern,
      dest: defaultConfig.sassBuild(),
      outputFilename: 'components.css',
      postcssPlugins: defaultConfig.postcssPluginsBase(),
      sassOptions: {
        includePaths: [
          path.resolve('./src'),
          path.resolve(defaultConfig.sassBase),
          path.resolve(defaultConfig.componentsPath),
        ],
      },
      loggerContext: '[Components]',
    })

    return streamToPromise(pipeline)
  } catch (error) {
    logger.error('[Components] Failure:', error)
  }
}

/**
 * Compiles all route-specific SCSS files.
 * @returns {Promise<void>}
 */
export async function compileRouteStyles() {
  try {
    const routeScssPattern = path
      .join(defaultConfig.routesBase, '**/*.scss')
      .replace(/\\/g, '/')

    // Check if files exist to avoid empty promise racing
    const files = await glob(routeScssPattern)
    if (files.length === 0) return Promise.resolve()

    return processSass(
      routeScssPattern,
      defaultConfig.sassBuild(),
      null,
      defaultConfig.postcssPluginsBase(),
      {
        sassOptions: {
          includePaths: [
            path.resolve('./src'),
            path.resolve(defaultConfig.sassBase),
            path.resolve(defaultConfig.routesBase),
          ],
        },
      }
    )
  } catch (error) {
    logger.error('[Routes] Failure:', error)
  }
}

export default processSass
