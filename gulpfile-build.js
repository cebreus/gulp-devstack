const gulp = require('gulp');

const cleanBuildFnc = require('./gulp-tasks-build/gulp-clean-build');
const compileSassFnc = require('./gulp-tasks-build/gulp-compile-sass');
const concatFilesFnc = require('./gulp-tasks-build/gulp-concat-files');
const buildHtmlFnc = require('./gulp-tasks-build/gulp-build-html');
const revisionFnc = require('./gulp-tasks-build/gulp-revision');
const replaceHashFnc = require('./gulp-tasks-build/gulp-sri-hash');

const buildDatasetFnc = require('./gulp-tasks/gulp-build-dataset');
const imagesFnc = require('./gulp-tasks/gulp-optimize-images');

// Variables
// --------------

const config = require('./gulpconfig-build');

// Gulp functions
// --------------

function cleanBuild() {
  return cleanBuildFnc(config.buildBase);
}

function compileSassAll() {
  return compileSassFnc(
    config.sassAll,
    config.sassBuild,
    'index.min.css',
    config.postcssPluginsBase
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
    injectJs: config.injectJs,
    cb: () => {
      done();
    }
  };
  buildHtmlFnc(params);
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

function replaceHash() {
  return replaceHashFnc(`${config.buildBase}/*.html`, config.buildBase);
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

// Gulp tasks
// --------------

gulp.task('clean-build', cleanBuild);
gulp.task('build:css', gulp.parallel(compileSassAll));
gulp.task('revision', gulp.series(revision));
gulp.task('replace-hash', replaceHash);
gulp.task('images', images);

// Aliases

gulp.task(
  'default',
  gulp.series(
    cleanBuild,
    'build:css',
    concatFiles,
    buildDataset,
    revision,
    buildHtml,
    replaceHash,
    images
  )
);
