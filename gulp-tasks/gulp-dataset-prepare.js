const gulp = require('gulp');
const plumber = require('gulp-plumber');
const markdownToJSON = require('gulp-markdown-to-json');
const marked = require('marked');
const rename = require('gulp-rename');

/**
 * @description Convert *.md to *.json
 * @param {string} input Path source *.md
 * @param {string} output Path to save files
 * @return {stream} processed files
 */

const datasetPrepare = (input, output, cb) => {
  return gulp
    .src(input)
    .pipe(plumber())
    .pipe(markdownToJSON(marked))
    .pipe(
      rename((path) => {
        if (path.dirname === '.' && path.basename === 'index') {
          return {
            basename: path.basename,
            dirname: '/',
            extname: '.json',
          };
        } else if (path.dirname !== '.') {
          return {
            basename: path.dirname,
            dirname: '/',
            extname: '.json',
          };
          console.log(path.dirname);
        }
      })
    )
    .pipe(gulp.dest(output))
    .on('end', cb);
};

module.exports = datasetPrepare;
