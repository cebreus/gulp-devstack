const gulp = require('gulp');
const gulpif = require('gulp-if');
const gulpStylelint = require('gulp-stylelint');
const plumber = require('gulp-plumber');

/**
 * @description Fix (S)CSS files
 * @param {string,object} input Path with filter to source files
 */

function fixCssOrScss(input, output) {
    return gulp
        .src(input)
        .pipe(plumber())
        .pipe(
            gulpif(
                '!bootstrap.scss',
                gulpStylelint({
                    fix: true,
                    failAfterError: false,
                    reporters: [{formatter: 'verbose', console: true}]
                })
            )
        )
        .pipe(gulpif('!bootstrap.scss', gulp.dest(output)));
}

module.exports = fixCssOrScss;
