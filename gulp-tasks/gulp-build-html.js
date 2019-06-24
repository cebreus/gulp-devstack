const fs = require('fs');
const gulp = require('gulp');
const gulpif = require('gulp-if');
const data = require('gulp-data');
const nunjucks = require('gulp-nunjucks');
const plumber = require('gulp-plumber');
const prettify = require('gulp-jsbeautifier');

/**
 * @description Compile Nunjucks templates and replaces variable from JSON
 * @param {string,object} input Path with filter to source files
 * @param {string} output Path to save compiled files
 * @param {string} dataSource Input file with data structure
 * @return {stream} Compiled file
 */

const buildHtml = (input, output, dataSource) => {
    let condition;

    try {
        fs.accessSync(dataSource);
        condition = true;
    } catch (error) {
        console.log("JSON file doesn't exists.");
        condition = false;
    }

    return gulp
        .src(input)
        .pipe(plumber())
        .pipe(
            gulpif(
                condition,
                data(function() {
                    return JSON.parse(fs.readFileSync(dataSource));
                })
            )
        )
        .pipe(nunjucks.compile())
        .pipe(prettify())
        .pipe(gulp.dest(output));
};

module.exports = buildHtml;
