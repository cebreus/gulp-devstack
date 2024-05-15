const gulp = require('gulp');
const log = require('fancy-log');
const { loadPlugin } = require('./helpers');

/**
 * Generates favicons using the specified input, output, and parameters.
 * @param {string} input - The input source for generating favicons.
 * @param {string} output - The output directory for the generated favicons.
 * @param {object} params - Additional parameters for generating favicons.
 * @param {Function} params.cb - Optional callback function to be executed after generating favicons.
 * @param {object} params.config - Configuration options for generating favicons.
 * @param {boolean} params.verbose - Flag indicating whether to log verbose output.
 * @returns {Promise} A promise that resolves when the favicons are generated.
 * @throws {Error} If the callback in params is not a function.
 */
const iconGenerator = async (input, output, params) => {
  const favicons = await loadPlugin('gulp-favicons');
  const cb = params.cb || (() => {});

  if (typeof cb !== 'function') {
    throw new Error('Callback in params should be of type function.');
  }

  return gulp
    .src(input)
    .pipe(favicons(params.config))
    .pipe(gulp.dest(output))
    .on('end', () => {
      if (params.verbose) {
        log(`         Favicons created`);
      }
      cb();
    });
};

module.exports = iconGenerator;
