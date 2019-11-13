const gulp = require('gulp');

const hotReload = require('./gulp-tasks/gulp-hotreload');
const buildHtmlFnc = require('./gulp-tasks/gulp-build-html');
const buildDatasetFnc = require('./gulp-tasks/gulp-build-dataset');
const compileSassFnc = require('./gulp-tasks/gulp-compile-sass');
const concatFilesFnc = require('./gulp-tasks/gulp-concat-files');
const fixCssFnc = require('./gulp-tasks/gulp-css-fix');
const lintCssFnc = require('./gulp-tasks/gulp-css-lint');
const fontLoadFnc = require('./gulp-tasks/gulp-font-load');
const faviconsFnc = require('./gulp-tasks/gulp-favicons');
const imagesFnc = require('./gulp-tasks/gulp-optimize-images');

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

function images(done) {
  imagesFnc.optimizeJpg(config.jpgImages, config.gfxBuild);
  imagesFnc.optimizePng(config.pngImages, config.gfxBuild);
  imagesFnc.optimizeSvg(config.svgImages, config.gfxBuild);

  done();
}

function favicons() {
  return faviconsFnc(
    config.faviconSourceFile,
    config.faviconBuild,
    config.faviconGenConfig
  );
}

function fontLoad(done) {
  fontLoadFnc(
    config.fontloadFile,
    config.buildBase,
    config.fontLoadConfig,
    () => {
      done();
    }
  );
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
  const params = {
    input: config.tplMain,
    output: config.tplBuild,
    dataSource: config.tplDataset,
    injectCdnJs: config.injectCdnJs,
    injectCss: config.injectCss,
    cb: () => {
      done();
    }
  };
  buildHtmlFnc(params);
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
gulp.task('fonts', fontLoad);
gulp.task('favicons', favicons);
gulp.task('images', images);

gulp.task(
  'serve',
  gulp.series(
    buildDataset,
    compileSassCore,
    compileSassCustom,
    compileSassUtils,
    fontLoad,
    buildHtml,
    favicons,
    images,
    gulp.parallel(watchFiles, hotReload.browserSync)
  )
);

// Aliases

gulp.task('watch', gulp.series('serve'));
gulp.task('default', gulp.series('serve'));
