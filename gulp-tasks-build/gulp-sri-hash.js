const gulp = require('gulp');
const sri = require('gulp-sri-hash');

/**
 * @description Add sri integrity hashes into link tags in html
 * @param {string} input path to HTML files
 * @param {string} output path to save HTML files
 * @return {stream} HTML files with integrity hashes
 */

const sriHash = (input, output, cb) => {
  return gulp.src(input).pipe(sri()).pipe(gulp.dest(output)).on('end', cb);
};

module.exports = sriHash;
