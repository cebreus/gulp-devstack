import gulp from 'gulp';

import log from 'fancy-log';
import { createRequire } from 'module';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const googleWebFonts = require('gulp-google-webfonts');

const __filename = fileURLToPath(import.meta.url);
dirname(__filename);

/**
 * Loads fonts using gulp-google-webfonts module.
 * @param {string} input - The input path of the fonts.
 * @param {string} output - The output path for the processed fonts.
 * @param {object} params - Additional parameters for font loading.
 * @param {Function} params.cb - Optional callback function to be executed after font processing.
 * @param {object} params.config - Configuration options for gulp-google-webfonts module.
 * @param {boolean} params.verbose - Flag indicating whether to log verbose output.
 * @throws {Error} If the callback in params is not a function.
 * @throws {Error} If gulp-google-webfonts module is not a function.
 * @returns {object} The gulp stream for font loading.
 */
function fontLoad(input, output, params) {
  const cb = params.cb || (() => {});

  if (typeof cb !== 'function') {
    throw new Error('Callback in params should be of type function.');
  }

  if (typeof googleWebFonts !== 'function') {
    throw new Error('gulp-google-webfonts module is not a function');
  }

  return gulp
    .src(input)
    .pipe(googleWebFonts(params.config))
    .pipe(gulp.dest(output))
    .on('end', () => {
      if (params.verbose) {
        log('         Font processed');
      }
      cb();
    });
}

export default fontLoad;
