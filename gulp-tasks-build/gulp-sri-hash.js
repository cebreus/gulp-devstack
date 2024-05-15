const gulp = require('gulp');
const log = require('fancy-log');
const minify = require('gulp-htmlmin');
const sri = require('gulp-sri-hash');

/**
 * Generates SRI (Subresource Integrity) hashes for the files in the specified input directory and writes them to the output directory.
 * @param {string} input - The input directory containing the files to generate SRI hashes for.
 * @param {string} output - The output directory where the files with SRI hashes will be written.
 * @param {object} [params] - Optional parameters.
 * @param {Function} [params.cb] - A callback function to be executed after the SRI hashes are generated and written.
 * @param {boolean} [params.verbose] - Specifies whether to log verbose output.
 * @throws {Error} Throws an error if the callback in params is not a function.
 * @returns {void} Returns a stream representing the Gulp task.
 */
const sriHash = (input, output, params = {}) => {
  const cb = params.cb || (() => {});

  if (typeof cb !== 'function') {
    throw new Error('Callback in params should be of type function.');
  }

  return (
    gulp
      .src(input)
      .pipe(sri())
      // Duplicate from `./gulp-html-build.js` because 'sri' converts `defer` to `defer=""`
      .pipe(
        minify({
          collapseWhitespace: true,
          collapseBooleanAttributes: true,
        }),
      )
      .pipe(gulp.dest(output))
      .on('end', () => {
        if (params.verbose) {
          log(`         SRI integrity hashes rewrite in ${output}`);
        }
        cb();
      })
  );
};

module.exports = sriHash;
