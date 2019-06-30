const gulp = require('gulp');

const compileSassFnc = require('./gulp-tasks-build/gulp-compile-sass');
const concatFilesFnc = require('./gulp-tasks-build/gulp-concat-files');
const revisionFnc = require('./gulp-tasks-build/gulp-revision');
const replaceHashFnc = require('./gulp-tasks-build/gulp-sri-hash');

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

function revision() {
    const params = {
        inputRevision: `${config.buildBase}/**/*.css`,
        outputRevision: config.buildBase,
        ouputManifest: `${config.templateFolder}/revision`,
        inputRewrite: `${config.buildBase}/*.html`,
        outputRewrite: config.buildBase,
        manifestFile: `${config.templateFolder}/revision/*.json`
    };
    return revisionFnc(params);
}

function replaceHash() {
    return replaceHashFnc(`${config.buildBase}/*.html`, config.buildBase);
}

// Gulp tasks
// --------------

gulp.task('build:css', gulp.parallel(compileSassAll));
gulp.task('revision', gulp.series(revision));
gulp.task('replace-hash', replaceHash);

// Aliases

gulp.task('default', gulp.series('build:css', revision, replaceHash));
