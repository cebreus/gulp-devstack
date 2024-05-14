const gulp = require('gulp');
const log = require('fancy-log');
const plumber = require('gulp-plumber');

/**
 * Copies files from the specified input path to the output path.
 * @param {string|string[]} input - The path or an array of paths to the files to be copied.
 * @param {string} basePath - The base path for the input files.
 * @param {string} output - The path to copy the files to.
 * @param {object} [params] - Additional parameters.
 * @param {Function} [params.cb] - The callback function to be executed after the files are copied.
 * @param {boolean} [params.verbose] - Whether to log verbose output.
 * @throws {Error} If the callback in params is not a function.
 * @returns {void} A Node.js ReadWriteStream representing the copy operation.
 */
const copy = (input, basePath, output, params = {}) => {
  const cb = params.cb || (() => {});

  if (typeof cb !== 'function') {
    throw new Error('Callback in params should be of type function.');
  }

  return gulp
    .src(input, { base: basePath })
    .pipe(plumber())
    .pipe(gulp.dest(output))
    .on('end', () => {
      if (params.verbose) {
        log(`         Copied files from '${input}' to '${output}'`);
      }
      cb();
    });
};

module.exports = copy;
