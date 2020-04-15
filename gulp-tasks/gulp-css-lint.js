const gulp = require('gulp');
const gulpif = require('gulp-if');
const gulpStylelint = require('gulp-stylelint');
const plumber = require('gulp-plumber');

/**
 * @description Linting CSS files
 * @param {string,object} input Path with filter to source files
 * @return {stream} Information into CLI
 */

function lintCssfromScss(input) {
  return gulp
    .src(input)
    .pipe(plumber())
    .pipe(
      gulpif(
        '!bootstrap.scss',
        gulpStylelint({
          reporters: [{ formatter: 'string', console: true }],
        })
      )
    );
}

module.exports = lintCssfromScss;
