const gulp = require('gulp');
const imagemin = require('gulp-imagemin');
const mozjpeg = require('imagemin-mozjpeg');
const newer = require('gulp-newer');
const upng = require('gulp-upng');
const plumber = require('gulp-plumber');

/**
 * @description Function for optimizing jpeg images
 * @param {string} input Path to jpg images
 * @param {string} output Path to save images
 * @return {stream} optimized jpg images
 */

const optimizeJpg = (input, output) => {
  return gulp
    .src(input)
    .pipe(plumber())
    .pipe(newer(output))
    .pipe(
      imagemin([
        mozjpeg({
          quantTable: 3,
          dcScanOpt: 2
        })
      ])
    )
    .pipe(gulp.dest(output));
};

/**
 * @description Function for optimizing png images
 * @param {string} input Path to png images
 * @param {string} output Path to save images
 * @return {stream} optimized png images
 */

const optimizePng = (input, output) => {
  return gulp
    .src(input)
    .pipe(plumber())
    .pipe(newer(output))
    .pipe(upng({}))
    .pipe(gulp.dest(output));
};

/**
 * @description Function for optimizing svg images
 * @param {string} input Path to svg images
 * @param {string} output Path to save images
 * @return {stream} optimized svg images
 */

const optimizeSvg = (input, output) => {
  return gulp
    .src(input)
    .pipe(plumber())
    .pipe(newer(output))
    .pipe(
      imagemin([
        imagemin.svgo({
          plugins: [
            {
              removeViewBox: false,
              collapseGroups: true
            }
          ]
        })
      ])
    )
    .pipe(gulp.dest(output));
};

module.exports = {
  optimizeJpg,
  optimizePng,
  optimizeSvg
};
