const gulp = require('gulp');
const gulpif = require('gulp-if');
const imagemin = require('gulp-imagemin');
const mozjpeg = require('imagemin-mozjpeg');
const newer = require('gulp-newer');
const upng = require('gulp-upng');
const plumber = require('gulp-plumber');

/**
 * @description Function for optimizing JPEG images
 * @param {string} input Path to JPEG files
 * @param {string} output Path to save files
 * @param {boolean} params.rewriteExisting Switcher for rewriting files
 * @return {stream} Optimized JPEG images
 */

const optimizeJpg = (input, output, params = {}) => {
  const rewriteExisting =
    params.rewriteExisting &&
    typeof params.rewriteExisting === 'boolean' &&
    params.rewriteExisting === true
      ? true
      : false;

  return gulp
    .src(input)
    .pipe(plumber())
    .pipe(gulpif(!rewriteExisting, newer(output)))
    .pipe(
      imagemin([
        mozjpeg({
          quantTable: 3,
          dcScanOpt: 2,
        }),
      ])
    )
    .pipe(gulp.dest(output));
};

/**
 * @description Function for optimizing PNG images
 * @param {string} input Path to PNG files
 * @param {string} output Path to save files
 * @param {boolean} params.rewriteExisting Switcher for rewriting files
 * @return {stream} Optimized PNG images
 */

const optimizePng = (input, output, params = {}) => {
  const rewriteExisting =
    params.rewriteExisting &&
    typeof params.rewriteExisting === 'boolean' &&
    params.rewriteExisting === true
      ? true
      : false;

  return gulp
    .src(input)
    .pipe(plumber())
    .pipe(gulpif(!rewriteExisting, newer(output)))
    .pipe(upng({}))
    .pipe(gulp.dest(output));
};

/**
 * @description Function for optimizing SVG images
 * @param {string} input Path to SVG files
 * @param {string} output Path to save files
 * @param {boolean} params.rewriteExisting Switcher for rewriting files
 * @return {stream} Optimized SVG images
 */

const optimizeSvg = (input, output, params = {}) => {
  const rewriteExisting =
    params.rewriteExisting &&
    typeof params.rewriteExisting === 'boolean' &&
    params.rewriteExisting === true
      ? true
      : false;

  return gulp
    .src(input)
    .pipe(plumber())
    .pipe(gulpif(!rewriteExisting, newer(output)))
    .pipe(
      imagemin([
        imagemin.svgo({
          plugins: [
            {
              removeViewBox: false,
              collapseGroups: true,
            },
          ],
        }),
      ])
    )
    .pipe(gulp.dest(output));
};

module.exports = {
  optimizeJpg,
  optimizePng,
  optimizeSvg,
};
