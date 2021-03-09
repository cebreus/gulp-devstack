const gulp = require('gulp');
const plumber = require('gulp-plumber');

/**
 * @description Clean function
 * @param {string} input path to folder for copy
 * @param {string} output destination path
 * @return {stream} Compiled file
 */

const copy = (input, basePath, output, cb) => {
  return gulp
    .src(input, { base: basePath })
    .pipe(plumber())
    .pipe(gulp.dest(output))
    .on('end', cb);
};

module.exports = copy;
