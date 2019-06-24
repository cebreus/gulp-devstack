const gulp = require('gulp');

const compileSassFnc = require('./gulp-tasks-build/gulp-compile-sass');
const concatFilesFnc = require('./gulp-tasks-build/gulp-concat-files');

// Variables
// --------------

const config = require('./gulpconfig-build');

// Gulp functions
// --------------

function compileSassAll() {
    return compileSassFnc(
        config.sassAll,
        config.sassBuild,
        'index.min.css',
        config.postcssPluginsBase
    );
}

// Gulp tasks
// --------------

gulp.task('build:css', gulp.parallel(compileSassAll));

// Aliases

gulp.task('default', gulp.series('build:css'));
