const gulp = require('gulp');
const gulpConcat = require('gulp-concat');
const plumber = require('gulp-plumber');

/**
 * @description Concatenate files into one file
 * @param {string,object} input Path with filter to source files
 * @param {string} output Path to save compiled files
 * @param {string} outputConcatFileName Output file name
 * @return {stream} compiled file
 */

const concatFiles = (input, output, outputConcatFileName) => {
    return gulp
        .src(input)
        .pipe(plumber())
        .pipe(gulpConcat(outputConcatFileName))
        .pipe(gulp.dest(output));
};

module.exports = concatFiles;
