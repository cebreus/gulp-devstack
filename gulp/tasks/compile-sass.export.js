import gulp from 'gulp'

import { suppressOutdatedBootstrapWarnings } from '../utils/helpers.js'
import { initializeSass } from '../utils/module-manager.js'
import autoprefixer from 'autoprefixer'
import concat from 'gulp-concat'
import prettify from 'gulp-jsbeautifier'
import postcss from 'gulp-postcss'

/**
 * Compiles SASS files to formatted CSS for export (beautified, no minify, no sourcemaps)
 * Uses centralized module management for consistent behavior across build modes
 * @param {string|Array} src - Source file(s) glob pattern
 * @param {string} dest - Destination directory
 * @param {string} outputFilename - Output filename
 * @param {Array} postcssPlugins - PostCSS plugins array
 * @param {object} options - Configuration options
 * @returns {any} A Gulp stream
 */
export default async function compileSassExport(
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
    // Configure Sass options, including a custom logger for warnings.
    const sassOptions = {
      quietDeps: true,
      outputStyle: 'expanded',
      includePaths: [],
      ...customSassOptions,
      logger: {
        warn: suppressOutdatedBootstrapWarnings,
        debug: function () {},
      },
    }

    // Create the Gulp stream for SASS compilation and beautification.
    let stream = gulp
      .src(src, {
        allowEmpty: true,
      })
      .pipe(
        sass(sassOptions).on('error', function (err) {
          suppressOutdatedBootstrapWarnings(err)
          this.emit('end')
        })
      )
      .pipe(postcss(postcssPluginsFinal))
      .pipe(concat(outputFilename))
      .pipe(
        prettify({
          indent_size: 4,
        })
      )
      .pipe(gulp.dest(dest))

    return stream
  } catch (error) {
    throw new Error(`SASS export compilation failed: ${error.message}`)
  }
}
