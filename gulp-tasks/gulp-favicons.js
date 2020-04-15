const gulp = require('gulp');
const favicons = require('gulp-favicons');

/**
 * @description generate favicon from source file
 * @param {stirng} input path to source icon
 * @param {string} output path to save icons
 * @param {object} params cofiguration for favicon generator
 */

const iconGenerator = (input, output, params) => {
  return gulp.src(input).pipe(favicons(params)).pipe(gulp.dest(output));
};

module.exports = iconGenerator;
