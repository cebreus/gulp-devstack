const gulp = require('gulp');
const googleWebFonts = require('gulp-google-webfonts');

/**
 * @description Download font from fonts.google.com into font folder and link them in fonts.css
 * @param {string} input Path to fonts.list file
 * @param {string} output Path to save files
 * @param {object} params Settings for googleWebFonts package
 * @return {stream} fonts in woff format inside font folder and fonts.css in css folder
 */

const fontLoad = (input, output, params, cb) => {
  return gulp
    .src(input)
    .pipe(googleWebFonts(params))
    .pipe(gulp.dest(output))
    .on('end', cb);
};

module.exports = fontLoad;
