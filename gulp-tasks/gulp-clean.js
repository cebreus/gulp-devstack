const gulp = require('gulp');
const gulpClean = require('gulp-clean');
const log = require('fancy-log');
const plumber = require('gulp-plumber');

/**
 * Cleans the specified input files or directories.
 * @param {string|string[]} input - The file(s) or directory(s) to clean.
 * @param {object} [params] - Optional parameters.
 * @param {Function} [params.cb] - The callback function to be called after cleaning is complete.
 * @param {boolean} [params.verbose] - Whether to log verbose output.
 * @returns {void}
 * @throws {Error} If the callback in params is not a function.
 */
const clean = (input, params = {}) => {
  const cb = params.cb || (() => {});

  if (typeof cb !== 'function') {
    throw new Error('Callback in params should be of type function.');
  }

  return gulp
    .src(input, { read: false, allowEmpty: true })
    .pipe(plumber())
    .pipe(gulpClean())
    .on('end', () => {
      if (params.verbose) {
        log(`         Files in '${input}' deleted.`);
      }
      cb();
    });
};

module.exports = clean;
