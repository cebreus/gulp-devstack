import gulp from 'gulp';

import log from 'fancy-log';
import gulpConcat from 'gulp-concat';
import gulpEmptyPipe from 'gulp-empty-pipe';
import prettify from 'gulp-jsbeautifier';
import plumber from 'gulp-plumber';
import postcss from 'gulp-postcss';
import replace from 'gulp-replace';
import gulpSass from 'gulp-sass';
import sassGlob from 'gulp-sass-glob';
import postcssSyntax from 'postcss-scss';
import * as sassCompiler from 'sass';

const sass = gulpSass(sassCompiler);

/**
 * Compiles Sass files.
 * @param {string} input - The input file or glob pattern.
 * @param {string} output - The output directory.
 * @param {string} outputConcatFileName - The name of the concatenated output file.
 * @param {Array} postcssPluginsBase - The array of PostCSS plugins to apply.
 * @param {object} params - Additional parameters.
 * @param {Function} params.cb - The callback function to execute after compilation.
 * @param {boolean} params.verbose - Whether to log verbose output.
 * @throws {Error} If the callback in params is not a function.
 * @returns {object} The Gulp stream.
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
    .pipe(replace(/\/\*!/g, '/*'))
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

export default compileSass;
