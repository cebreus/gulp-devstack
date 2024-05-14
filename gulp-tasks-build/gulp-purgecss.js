const gulp = require('gulp');
const log = require('fancy-log');
const plumber = require('gulp-plumber');
const purgecss = require('gulp-purgecss');

/**
 * Purges unused CSS from the input CSS file based on the selectors used in the input HTML file.
 * @param {string} inputCss - The path to the input CSS file.
 * @param {string} inputHtml - The path to the input HTML file.
 * @param {string} outputCss - The path to the output CSS file.
 * @param {object} [params] - Optional parameters.
 * @param {Function} [params.cb] - The callback function to be executed after the purge is complete.
 * @param {boolean} [params.verbose] - Whether to log verbose output.
 * @throws {Error} If the callback in params is not a function.
 * @returns {void} The gulp stream for further processing.
 */
const purgeCss = (inputCss, inputHtml, outputCss, params = {}) => {
  const cb = params.cb || (() => {});

  if (typeof cb !== 'function') {
    throw new Error('Callback in params should be of type function.');
  }

  return gulp
    .src(inputCss)
    .pipe(plumber())
    .pipe(
      purgecss({
        content: inputHtml,
        safelist: {
          standard: [
            'active',
            'collapsing',
            'fade',
            'offcanvas-backdrop',
            'open',
            'scroll',
            'show',
          ],
        },
        // rejected: true,
      }),
    )
    .pipe(gulp.dest(outputCss))
    .on('end', () => {
      if (params.verbose) {
        log(`         PurgeCSS done.`);
      }
      cb();
    });
};

module.exports = purgeCss;
