import gulp from 'gulp'

import { suppressOutdatedBootstrapWarnings } from '../utils/helpers.js'
import { initializeSass } from '../utils/module-manager.js'
import autoprefixer from 'autoprefixer'
import cssnano from 'cssnano'
import concat from 'gulp-concat'
import postcss from 'gulp-postcss'
import sourcemaps from 'gulp-sourcemaps'

/**
 * Compiles SASS files to CSS for production builds (minified, with optional sourcemaps)
 * Uses centralized module management for consistent behavior across build modes
 * @param {string|Array} src - Source file(s)
 * @param {string} dest - Destination directory
 * @param {string} outputFilename - Output filename
 * @param {Array} postcssPlugins - PostCSS plugins
 * @param {object} options - Build options
 * @param {boolean} [options.sourceMaps] - Generate source maps
 * @param {boolean} [options.minify] - Generate minified CSS
 * @param {object} [options.sassOptions] - Additional Sass options
 * @returns {Promise<import('stream').Readable>} A Gulp stream
 */
export default async function compileSassBuild(
  src,
  dest,
  outputFilename,
  postcssPlugins = [],
  options = {}
) {
  try {
    const sass = await initializeSass()
    const {
      sassOptions: customSassOptions = {},
      sourceMaps = false,
      minify = true,
    } = options

    // Define PostCSS plugins, including cssnano for minification if enabled.
    const postcssPluginsFinal = postcssPlugins.length
      ? postcssPlugins
      : [autoprefixer()]

    const postcssPluginsMin = [...postcssPluginsFinal, cssnano()]

    // Configure Sass options, including output style and custom logger.
    const sassOptions = {
      quietDeps: true,
      outputStyle: minify ? 'compressed' : 'expanded',
      ...customSassOptions,
      logger: {
        warn: suppressOutdatedBootstrapWarnings,
        debug: function () {},
      },
    }

    // Create the Gulp stream.
    let stream = gulp.src(src)

    // Initialize sourcemaps if enabled.
    if (sourceMaps) {
      stream = stream.pipe(sourcemaps.init())
    }

    // Pipe through Sass, PostCSS, and concat.
    stream = stream
      .pipe(
        sass(sassOptions).on('error', function (err) {
          suppressOutdatedBootstrapWarnings(err)
          this.emit('end')
        })
      )
      .pipe(postcss(minify ? postcssPluginsMin : postcssPluginsFinal))
      .pipe(
        concat(
          minify ? outputFilename.replace(/\.css$/, '.min.css') : outputFilename
        )
      )

    // Write sourcemaps if enabled.
    if (sourceMaps) {
      stream = stream.pipe(sourcemaps.write('./maps'))
    }

    // Write the compiled CSS to the destination.
    stream = stream.pipe(gulp.dest(dest))

    return stream
  } catch (error) {
    throw new Error(`SASS build compilation failed: ${error.message}`)
  }
}
