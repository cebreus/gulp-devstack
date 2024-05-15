const { marked } = require('marked');
const gulp = require('gulp');
const log = require('fancy-log');
const markdownToJSON = require('gulp-markdown-to-json');
const plumber = require('gulp-plumber');
const rename = require('gulp-rename');
const through2 = require('through2');

marked.setOptions({
  mangle: false,
  headerIds: false,
});

/**
 * Prepares a dataset by converting Markdown files to JSON format and saving them to the specified output directory.
 * @param {string|string[]} input - The input file(s) or glob pattern(s) to be processed.
 * @param {string} output - The output directory where the converted JSON files will be saved.
 * @param {object} [params] - Optional parameters.
 * @param {boolean} [params.verbose] - Whether to log verbose output.
 * @param {Function} params.cb - Callback function to be called after the dataset preparation is complete.
 * @returns {void} - A Node.js ReadWriteStream representing the dataset preparation process.
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
      }),
    )
    .pipe(gulp.dest(output))
    .pipe(
      through2.obj((file, enc, cb) => {
        files.push(file.path);
        cb();
      }),
    )
    .on('end', () => {
      if (params.verbose) {
        log(`         ${files.length} JSON written`);
      }
      params.cb();
    });
};

module.exports = datasetPrepare;
