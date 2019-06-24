//const browsersync = require('browser-sync').create();
const gulp = require('gulp');
const plumber = require('gulp-plumber');
const postcss = require('gulp-postcss');
const postcssSyntax = require('postcss-scss');
const prettify = require('gulp-jsbeautifier');
const sass = require('gulp-sass');
const sassGlob = require('gulp-sass-glob');
const sourcemaps = require('gulp-sourcemaps');

/**
 * @description Compiling SCSS files into CSS files
 * @param {string,object} input Path with filter to source files
 * @param {string} output Path to save compiled files
 * @param {string} outputConcatFileName Output file name
 * @param {object} postcssPluginsBase Postcss plugins
 * @return {stream} compiled file
 */
// TODO: pokial je volitelny parameter, tak by mal ist na koniec
const compileSass = (
    input,
    output,
    outputConcatFileName,
    postcssPluginsBase
) => {
    let gulpConcat = require('gulp-concat');

    if (!outputConcatFileName) {
        gulpConcat = require('gulp-empty-pipe');
    }

    return gulp
        .src(input)
        .pipe(plumber())
        .pipe(sassGlob())
        .pipe(sourcemaps.init())
        .pipe(sass())
        .on('error', sass.logError)
        .pipe(postcss(postcssPluginsBase, { syntax: postcssSyntax }))
        .pipe(prettify({ indent_size: 4 }))
        .pipe(gulpConcat(outputConcatFileName))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(output));
    //.pipe(browsersync.stream());
};

module.exports = compileSass;
