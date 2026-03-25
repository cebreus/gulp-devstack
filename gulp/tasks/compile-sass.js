import gulp from 'gulp'

import { suppressOutdatedBootstrapWarnings } from '../utils/helpers.js'
import logger from '../utils/logger.js'
import { initializeSass } from '../utils/module-manager.js'
import autoprefixer from 'autoprefixer'
import concat from 'gulp-concat'
import postcss from 'gulp-postcss'
import path from 'node:path'
import pc from 'picocolors'

/**
 * Compiles SASS files to CSS using modern ESM patterns with centralized module management
 * @param {string|Array} src - Source file(s) glob pattern
 * @param {string} dest - Destination directory
 * @param {string} outputFilename - Output filename
 * @param {Array} postcssPlugins - PostCSS plugins array
 * @param {object} options - Configuration options
 * @param {object} [options.sassOptions] - Sass compiler options
 * @returns {Promise<import('stream').Readable>} Promise that resolves to a Gulp stream
 */
export default async function compileSass(
  src,
  dest,
  outputFilename,
  postcssPlugins = [],
  options = {}
) {
  try {
    const sass = await initializeSass()
    const { sassOptions: customSassOptions = {} } = options
    // Use default PostCSS plugins if none are provided.
    const postcssPluginsFinal = postcssPlugins.length
      ? postcssPlugins
      : [autoprefixer()]
    const sassOptions = {
      quietDeps: true,
      outputStyle: 'expanded',
      ...customSassOptions,
      logger: {
        warn: suppressOutdatedBootstrapWarnings,
      },
    }

    // Create the Gulp stream for SASS compilation.
    return gulp
      .src(src, {
        allowEmpty: true,
      })
      .pipe(
        sass(sassOptions).on('error', function (...args) {
          const isSuppressed = suppressOutdatedBootstrapWarnings(...args)
          if (isSuppressed) {
            this.emit('end')
          } else {
            logger.error('[SASS] Error:', ...args)
            this.emit('error', ...args)
          }
        })
      )
      .pipe(postcss(postcssPluginsFinal))
      .pipe(concat(outputFilename))
      .pipe(gulp.dest(dest))
      .on('end', () => {
        logger.verbose(
          `[SASS] Generated: ${pc.yellow(path.relative(process.cwd(), path.join(dest, outputFilename)))}`
        )
      })
  } catch (error) {
    logger.error('[SASS] Original error:', error)
    throw error
  }
}
