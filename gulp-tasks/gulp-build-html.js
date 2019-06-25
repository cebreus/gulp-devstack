const fs = require('fs');
const gulp = require('gulp');
const gulpif = require('gulp-if');
const data = require('gulp-data');
const nunjucks = require('gulp-nunjucks');
const plumber = require('gulp-plumber');
const prettify = require('gulp-jsbeautifier');
const replace = require('gulp-replace');

/**
 * @description Compile Nunjucks templates and replaces variable from JSON
 * @param {string,object} input Path with filter to source files
 * @param {string} output Path to save compiled files
 * @param {string} dataSource Input file with data structure
 * @return {stream} Compiled file
 */

const buildHtml = (params) => {
    let condition;

    try {
        fs.accessSync(params.dataSource);
        condition = true;
    } catch (error) {
        console.log("JSON file doesn't exists.");
        condition = false;
    }

    return gulp
        .src(params.input)
        .pipe(plumber())
        .pipe(
            gulpif(
                condition,
                data(function() {
                    return JSON.parse(fs.readFileSync(params.dataSource));
                })
            )
        )
        .pipe(nunjucks.compile())
        .pipe(
            replace(
                '<!-- inject: bootstrap js -->',
                params.injectCdnJs.toString().replace(/[, ]+/g, ' ')
            )
        )
        .pipe(prettify())
        .pipe(gulp.dest(params.output))
        .on('end', params.cb);
};

module.exports = buildHtml;
