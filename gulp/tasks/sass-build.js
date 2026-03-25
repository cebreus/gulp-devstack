import gulp from 'gulp'

import logger from '../utils/logger.js'
import { initializeSass } from '../utils/module-manager.js'
import { glob } from 'glob'
import path from 'node:path'

/**
 * Build SASS files with component support using centralized module management
 * @param {object} config - Configuration object
 * @returns {Promise<any>|undefined} Returns a Promise that resolves to the Gulp stream, or undefined if an error occurs
 */
export default async function buildSass(config) {
  try {
    const sass = await initializeSass()

    // Find all component SCSS files.
    const componentScssFiles = glob.sync(
      path.join(config.componentsPath, '**/*.scss')
    )
    logger.verbose(`Found ${componentScssFiles.length} component SCSS files`)

    // Set the SASS options.
    const sassOptions = {
      includePaths: ['./node_modules', config.sassBase, config.componentsPath],
    }

    // Process the main SASS files and component files.
    return gulp
      .src([path.join(config.sassBase, '*.scss')])
      .pipe(sass(sassOptions))
      .pipe(gulp.dest(config.sassBuild()))
      .on('end', () => {
        logger.verbose('SASS compilation completed')
      })
  } catch (error) {
    logger.error('SASS build failed:', error)
  }
}
