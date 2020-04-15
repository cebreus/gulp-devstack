const gulp = require('gulp');
const gulpif = require('gulp-if');
const gulpStylelint = require('gulp-stylelint');
const plumber = require('gulp-plumber');

/**
 * @description Fix (S)CSS files
 * @param {string,object} input Path with filter to source files
 * @param {string} output Path to save processed files
 * @return {stream} Processed files
 */

function fixCssOrScss(input, output) {
  return gulp
    .src(input)
    .pipe(plumber())
    .pipe(
      gulpif(
        '!_variables.scss',
        gulpStylelint({
          fix: true,
          failAfterError: false,
          reporters: [{ formatter: 'verbose', console: true }],
        })
      )
    )
    .pipe(gulpif('!_variables.scss', gulp.dest(output)));
}

module.exports = fixCssOrScss;
