const gulp = require('gulp');
const gulpConcat = require('gulp-concat');
const gulpEmptyPipe = require('gulp-empty-pipe');
const log = require('fancy-log');
const plumber = require('gulp-plumber');
const postcss = require('gulp-postcss');
const postcssSyntax = require('postcss-scss');
const prettify = require('gulp-jsbeautifier');
const replace = require('gulp-replace');
const sass = require('gulp-sass')(require('sass'));
const sassGlob = require('gulp-sass-glob');

/**
 * Compiles Sass files and performs additional processing.
 * @param {string} input - The input file or glob pattern.
 * @param {string} output - The output directory.
 * @param {string} outputConcatFileName - The name of the concatenated output file (optional).
 * @param {Array} postcssPluginsBase - An array of PostCSS plugins to apply.
 * @param {object} params - Additional parameters (optional).
 * @param {Function} params.cb - Callback function to execute after processing (optional).
 * @param {boolean} params.verbose - Whether to log verbose output (optional).
 * @returns {object} - The Gulp stream.
 * @throws {Error} - If the callback in params is not a function.
 */
const compileSass = (
  input,
  output,
  outputConcatFileName,
  postcssPluginsBase,
  params = {},
) => {
  const cb = params.cb || (() => {});

  if (typeof cb !== 'function') {
    throw new Error('Callback in params should be of type function.');
  }

  const processFile = outputConcatFileName ? gulpConcat : gulpEmptyPipe;

  return gulp
    .src(input)
    .pipe(plumber())
    .pipe(sassGlob())
    .pipe(sass())
    .on('error', sass.logError)
    .pipe(replace('@charset "UTF-8";', ''))
    .pipe(postcss(postcssPluginsBase, { syntax: postcssSyntax }))
    .pipe(prettify({ indent_size: 4 }))
    .pipe(processFile(outputConcatFileName))
    .pipe(gulp.dest(output))
    .on('end', () => {
      if (params.verbose) {
        log(`         SASS processed`);
      }
      cb();
    });
};

module.exports = compileSass;
