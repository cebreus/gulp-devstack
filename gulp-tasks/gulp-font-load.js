const googleWebFonts = require('gulp-google-webfonts');
const gulp = require('gulp');
const log = require('fancy-log');

/**
 * Loads fonts from the specified input directory, processes them, and saves them to the output directory.
 * @param {string} input - The input directory path where the fonts are located.
 * @param {string} output - The output directory path where the processed fonts will be saved.
 * @param {object} params - Additional parameters for font loading.
 * @param {Function} params.cb - Optional callback function to be called after the fonts are processed.
 * @param {boolean} params.verbose - Optional flag to enable verbose logging.
 * @param {object} params.config - Configuration options for the font loading process.
 * @returns {void} - A stream representing the font loading process.
 * @throws {Error} - If the callback in params is not a function.
 */
const fontLoad = (input, output, params) => {
  const cb = params.cb || (() => {});

  if (typeof cb !== 'function') {
    throw new Error('Callback in params should be of type function.');
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
};

module.exports = fontLoad;
