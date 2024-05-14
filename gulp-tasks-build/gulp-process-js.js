const babel = require('gulp-babel');
const gulp = require('gulp');
const gulpConcat = require('gulp-concat');
const gulpif = require('gulp-if');
const log = require('fancy-log');
const newer = require('gulp-newer');
const plumber = require('gulp-plumber');
const uglify = require('gulp-uglify');

/**
 * Process JavaScript files.
 * @param {string|string[]} input - The input file(s) or glob pattern(s).
 * @param {string} output - The output directory.
 * @param {object} [params] - Optional parameters.
 * @param {Function} [params.cb] - Callback function to be executed after processing.
 * @param {boolean} [params.rewriteExisting] - Whether to rewrite existing files.
 * @param {boolean} [params.concatFiles] - Whether to concatenate files.
 * @param {string} [params.outputConcatPrefixFileName] - The prefix for the concatenated output file name.
 * @param {boolean} [params.verbose] - Whether to log verbose output.
 * @returns {void} - The gulp stream.
 * @throws {Error} - If the callback parameter is not a function.
 */
const processJs = (input, output, params = {}) => {
  const cb = params.cb || (() => {});

  if (typeof cb !== 'function') {
    throw new Error('Callback in params should be of type function.');
  }

  const rewriteExisting = !!(
    params.rewriteExisting &&
    typeof params.rewriteExisting === 'boolean' &&
    params.rewriteExisting === true
  );

  const concatFiles = !!(
    params.concatFiles &&
    typeof params.concatFiles === 'boolean' &&
    params.concatFiles === true
  );

  const outputConcatFileName = `${params.outputConcatPrefixFileName}.min.js`;

  return gulp
    .src(input)
    .pipe(plumber())
    .pipe(gulpif(!rewriteExisting, newer(output)))
    .pipe(
      babel({
        presets: [
          [
            '@babel/preset-env',
            {
              targets: {
                browsers: ['last 2 versions'],
              },
            },
          ],
        ],
      }),
    )
    .pipe(uglify())
    .pipe(gulpif(concatFiles, gulpConcat(outputConcatFileName)))
    .pipe(gulp.dest(output))
    .on('end', () => {
      if (params.verbose) {
        log(`         JS files processed.`);
      }
      cb();
    });
};

module.exports = processJs;
