const gulp = require('gulp');

const buildDatasetFnc = require('./gulp-tasks/gulp-build-dataset');
const buildHtmlFnc = require('./gulp-tasks-build/gulp-build-html');
const compileSassFnc = require('./gulp-tasks-build/gulp-compile-sass');
const concatFilesFnc = require('./gulp-tasks-build/gulp-concat-files');
const imagesFnc = require('./gulp-tasks/gulp-optimize-images');

const cleanBuildFnc = require('./gulp-tasks-build/gulp-clean-build');
const replaceHashFnc = require('./gulp-tasks-build/gulp-sri-hash');
const revisionFnc = require('./gulp-tasks-build/gulp-revision');

// Variables
// --------------

const config = require('./gulpconfig-build');

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
    }
  };
  buildHtmlFnc(params);
}

function concatFiles() {
  return concatFilesFnc(config.jsFiles, config.jsBuild, 'index.min.js');
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
    'index.min.css',
    config.postcssPluginsBase
  );
}

function cleanBuild() {
  return cleanBuildFnc(config.buildBase);
}

function replaceHash() {
  return replaceHashFnc(`${config.buildBase}/*.html`, config.buildBase);
}

function revision() {
  const params = {
    inputRevision: `${config.buildBase}/**/*.css`,
    outputRevision: config.buildBase,
    ouputManifest: `${config.tempBase}/revision`,
    inputRewrite: `${config.buildBase}/*.html`,
    outputRewrite: config.buildBase,
    manifestFile: `${config.tempBase}/revision/*.json`
  };
  return revisionFnc(params);
}

// Gulp tasks
// --------------

gulp.task('build:css', gulp.parallel(compileSassAll));
gulp.task('cleanup', cleanBuild);
gulp.task('images', images);

// Aliases

gulp.task(
  'default',
  gulp.series(
    cleanBuild,
    buildDataset,
    concatFiles,
    compileSassAll,
    revision,
    buildHtml,
    replaceHash,
    images
  )
);
