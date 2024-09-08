import gulp from 'gulp';

import log from 'fancy-log';
import minify from 'gulp-htmlmin';
import sri from 'gulp-sri-hash';

/**
 * Calculates the SRI (Subresource Integrity) hash for the given input files and writes the output to the specified destination.
 * @param {string|string[]} input - The input file(s) to calculate the SRI hash for.
 * @param {string} output - The destination directory to write the SRI hash files to.
 * @param {object} [params] - Optional parameters.
 * @param {Function} [params.cb] - A callback function to be executed after the SRI hash calculation and file writing is complete.
 * @param {boolean} [params.verbose] - Specifies whether to log verbose output.
 * @returns {void}
 * @throws {Error} Throws an error if the callback in params is not a function.
 */
const sriHash = (input, output, params = {}) => {
  const cb = params.cb || (() => {});

  if (typeof cb !== 'function') {
    throw new Error('Callback in params should be of type function.');
  }

  return gulp
    .src(input)
    .pipe(sri())
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
    });
};

export default sriHash;
