const gulp = require('gulp');
const log = require('fancy-log');
const validate = require('gulp-html-validate');

/**
 * Validates HTML files using gulp-html-validate.
 * @param {string|string[]} input - The file path(s) or glob pattern(s) of the HTML file(s) to validate.
 * @param {object} params - Additional parameters for customization.
 * @param {Function} params.cb - Callback function to execute after the validation is complete.
 * @param {boolean} params.verbose - Whether to log verbose output.
 * @throws {Error} If the callback in params is not a function.
 * @returns {void}
 */
const htmlValidate = (input, params) => {
  const cb = params.cb || (() => {});

  if (typeof cb !== 'function') {
    throw new Error('Callback in params should be of type function.');
  }

  return gulp
    .src(input)
    .pipe(validate())
    .pipe(validate.format())
    .pipe(validate.failAfterError())
    .on('end', () => {
      if (params.verbose) {
        log(`         HTML validation in ${input}`);
      }
      cb();
    });
};

module.exports = htmlValidate;
