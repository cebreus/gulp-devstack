const fs = require('fs');
const gulp = require('gulp');
const gulpif = require('gulp-if');
const babel = require('gulp-babel');
const gulpConcat = require('gulp-concat');
const plumber = require('gulp-plumber');

/**
 * @description Transpile JavaScript files
 * @param {string,object} input Path with filter to source files
 * @param {string} output Path to save transpiled files
 * @param {boolean} params.concatFiles Switcher for concating files
 * @param {string} params.outputConcatPrefixFileName Prefix of your output file name
 * @return {stream} Transpiled file/files
 */

const processJs = (input, output, params = {}) => {
  const concatFiles =
    params.concatFiles &&
    typeof params.concatFiles === 'boolean' &&
    params.concatFiles === true
      ? true
      : false;

  const outputConcatFileName = `${params.outputConcatPrefixFileName}.js`;

  if (fs.existsSync(`${output}/${outputConcatFileName}`)) {
    throw Error(
      `There is already ${outputConcatFileName} inside your output folder. Please change outputConcatPrefixFileName in gulpfile-export.js.`
    );
  }

  return gulp
    .src(input)
    .pipe(plumber())
    .pipe(
      babel({
        presets: [
          [
            'env',
            {
              targets: {
                browsers: ['last 2 versions', 'ie >= 11'],
              },
            },
          ],
        ],
        plugins: ['babel-plugin-loop-optimizer'],
      })
    )

    .pipe(gulpif(concatFiles, gulpConcat(outputConcatFileName)))
    .pipe(gulp.dest(output));
};

module.exports = processJs;
