const { marked } = require('marked');
const gulp = require('gulp');
const log = require('fancy-log');
const markdownToJSON = require('gulp-markdown-to-json');
const plumber = require('gulp-plumber');
const rename = require('gulp-rename');
const through2 = require('through2');

/**
 * @description Convert *.md to *.json
 * @param {string} input Path source *.md
 * @param {string} output Path to save files
 * @param {object} params
 * @returns {*} Processed files
 */

const datasetPrepare = (input, output, params = {}) => {
  const files = [];

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
        }
        if (path.dirname !== '.') {
          return {
            basename: path.dirname,
            dirname: '/',
            extname: '.json',
          };
        }
        return '';
      })
    )
    .pipe(gulp.dest(output))
    .pipe(
      through2.obj((file, enc, cb) => {
        files.push(file.path);
        cb();
      })
    )
    .on('end', () => {
      if (params.verbose) {
        log(`         ${files.length} JSON written`);
      }
      params.cb();
    });
};

module.exports = datasetPrepare;
