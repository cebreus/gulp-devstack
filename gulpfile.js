const gulp = require('gulp');

const hotReload = require('./gulp-tasks/gulp-hotreload');
const buildHtmlFnc = require('./gulp-tasks/gulp-build-html');
const buildDatasetFnc = require('./gulp-tasks/gulp-build-dataset');
const compileSassFnc = require('./gulp-tasks/gulp-compile-sass');
const concatFilesFnc = require('./gulp-tasks/gulp-concat-files');
const fixCssFnc = require('./gulp-tasks/gulp-css-fix');
const lintCssFnc = require('./gulp-tasks/gulp-css-lint');

// Variables
// --------------

const config = require('./gulpconfig');

// Gulp functions
// --------------

function compileSassCore() {
    return compileSassFnc(
        config.sassCore,
        config.sassBuild,
        'bootstrap.css',
        config.postcssPluginsBase
    );
}

function compileSassCustom() {
    return compileSassFnc(
        config.sassCustom,
        config.sassBuild,
        'custom.css',
        config.postcssPluginsBase
    );
}

function compileSassUtils() {
    return compileSassFnc(
        config.sassUtils,
        config.sassBuild,
        'utils.css',
        config.postcssPluginsBase
    );
}

function lintCss(done) {
    lintCssFnc(config.sassAll);
    //console.log("\n\n");
    //lintCssPropsFnc(config.sassAll);
    //console.log("\n\n");
    //lintCssColorsFnc(config.sassAll);
    done();
}

function fixCss(done) {
    fixCssFnc(config.sassCustom, config.sassBase);
    done();
}

function buildDataset(done) {
    buildDatasetFnc(
        config.datasetJsonBase,
        config.datasetJsonBuild,
        config.datasetJsonFileName,
        () => {
            done();
        }
    );
}

function buildHtml(done) {
    buildHtmlFnc(config.tplMain, config.tplBuild, config.tplDataset, () => {
        done();
    });
}

function watchFiles() {
    gulp.watch(
        config.sassCustom,
        gulp.series(compileSassCustom, hotReload.browserSyncReload)
    );
    gulp.watch(
        config.sassCore,
        gulp.series(compileSassCore, hotReload.browserSyncReload)
    );
    gulp.watch(
        config.sassUtils,
        gulp.series(compileSassUtils, hotReload.browserSyncReload)
    );
    gulp.watch(
        config.tplMain,
        gulp.series(buildHtml, hotReload.browserSyncReload)
    );
    gulp.watch(
        config.datasetJsonBase,
        gulp.series(buildDataset, buildHtml, hotReload.browserSyncReload)
    );
}

// Gulp tasks
// --------------

gulp.task(
    'build:css',
    gulp.parallel(compileSassCore, compileSassCustom, compileSassUtils)
);
gulp.task('cssfix', fixCss);
gulp.task('csslint', lintCss);
gulp.task('dataset', buildDataset);
gulp.task('html', gulp.series(buildDataset, buildHtml));
gulp.task(
    'serve',
    gulp.series(
        buildDataset,
        compileSassCore,
        compileSassCustom,
        compileSassUtils,
        buildHtml,
        gulp.parallel(watchFiles, hotReload.browserSync)
    )
);

// Aliases

gulp.task('watch', gulp.series('serve'));
gulp.task('default', gulp.series('serve'));
