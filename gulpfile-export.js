const gulp = require('gulp');

const buildDatasetFnc = require('./gulp-tasks/gulp-build-dataset');
const buildHtmlFnc = require('./gulp-tasks-export/gulp-build-html');
const compileSassFnc = require('./gulp-tasks-export/gulp-compile-sass');
const imagesFnc = require('./gulp-tasks/gulp-optimize-images');
const processJsFnc = require('./gulp-tasks-export/gulp-process-js');

const cleanFnc = require('./gulp-tasks-build/gulp-clean');

// Variables
// --------------

const config = require('./gulpconfig-export');

// Gulp functions
// --------------

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
    injectJs: config.injectJs,
    injectCss: config.injectCss,
    cb: () => {
      done();
    },
  };
  buildHtmlFnc(params);
}

function processJs() {
  return processJsFnc(config.jsFiles, config.jsBuild, {
    concatFiles: true,
    outputConcatPrefixFileName: 'app',
  });
}

function images(done) {
  imagesFnc.optimizeJpg(config.jpgImages, config.gfxBuild);
  imagesFnc.optimizePng(config.pngImages, config.gfxBuild);
  imagesFnc.optimizeSvg(config.svgImages, config.gfxBuild);

  done();
}

function compileSassAll() {
  return compileSassFnc(
    config.sassAll,
    config.sassBuild,
    'index.css',
    config.postcssPluginsBase
  );
}

function cleanFolders() {
  cleanFnc(config.tempBase);
  return cleanFnc(config.buildBase);
}

// Gulp tasks
// --------------

gulp.task('build:css', gulp.parallel(compileSassAll));
gulp.task('cleanup', cleanFolders);
gulp.task('images', images);

// Aliases

gulp.task(
  'default',
  gulp.series(
    cleanFolders,
    buildDataset,
    processJs,
    compileSassAll,
    buildHtml,
    images
  )
);
