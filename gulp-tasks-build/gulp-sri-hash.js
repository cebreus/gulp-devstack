const gulp = require('gulp');
const sri = require('gulp-sri-hash');

/**
 * @description Add sri integrity hashes into link tags in html
 * @param {string} input path to HTML files
 * @param {string} output path to save HTML files
 * @return {stream} HTML files with integrity hashes
 */

const sriHash = (input, output) => {
  return gulp.src(input).pipe(sri()).pipe(gulp.dest(output));
};

module.exports = sriHash;
