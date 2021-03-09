const fs = require('fs');
const gulp = require('gulp');
const gulpif = require('gulp-if');
const babel = require('gulp-babel');
const gulpConcat = require('gulp-concat');
const plumber = require('gulp-plumber');
const uglify = require('gulp-uglify');

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

  const outputConcatFileName = `${params.outputConcatPrefixFileName}.min.js`;

  if (fs.existsSync(`${output}/${outputConcatFileName}`)) {
    throw Error(
      `There is already ${outputConcatFileName} inside your output folder.  Please change outputConcatPrefixFileName in gulpfile-build.js.`
    );
  }

  return gulp
    .src(input)
    .pipe(plumber())
    .pipe(
      babel({
        presets: [
          [
            '@babel/preset-env',
            {
              targets: {
                browsers: ['last 2 versions'],
              },
            },
          ],
        ],
      })
    )
    .pipe(uglify())
    .pipe(gulpif(concatFiles, gulpConcat(outputConcatFileName)))
    .pipe(gulp.dest(output));
};

module.exports = processJs;
