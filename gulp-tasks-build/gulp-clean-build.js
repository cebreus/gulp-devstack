const gulp = require('gulp');
const plumber = require('gulp-plumber');
const clean = require('gulp-clean');

/**
 * @description Clean build folder
 * @param {string} buildBase path to buildbase
 * @return {stream} Compiled file
 */

const cleanBuild = (buildBase) => {
  return gulp
    .src(buildBase, { read: false, allowEmpty: true })
    .pipe(plumber())
    .pipe(clean());
};

module.exports = cleanBuild;
