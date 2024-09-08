import gulp from 'gulp';

import * as config from './src/lib/constants/gulpconfig.js';

import jsProcessFnc from './src/lib/tasks/gulp-process-js.build.js';
import cleanFnc from './src/lib/tasks/gulp-clean.js';
import cssCompileFnc from './src/lib/tasks/gulp-compile-sass.js';
import copyStaticFnc from './src/lib/tasks/gulp-copy-static.js';
import datasetPrepareFnc from './src/lib/tasks/gulp-dataset-prepare.js';
import fontLoadFnc from './src/lib/tasks/gulp-font-load.js';
import * as hotReload from './src/lib/tasks/gulp-hotreload.js';
import htmlBuildFnc from './src/lib/tasks/gulp-html-build.js';
import * as imagesOptimizeFnc from './src/lib/tasks/gulp-optimize-images.js';
import todoFnc from './src/lib/tasks/gulp-todo.js';

// Variables
// --------------

const showLogs = 'brief';

// Gulp functions
// --------------

/**
 * Cleans the folders specified in the `config.buildBase` variable.
 * @returns {Promise} A promise that resolves when the folders are cleaned.
 */
function cleanFolders() {
  return cleanFnc(config.buildBase);
}

/**
 * Copies static files from the source directory to the build directory.
 * @param {Function} done - Callback function to be called when the copying is complete.
 * @returns {Promise} - A promise that resolves when the copying is complete.
 */
function copyStatic(done) {
  return copyStaticFnc(
    [
      `${config.staticBase}/*`,
      `${config.staticBase}/**/*`,
      `${config.staticBase}/.*/*`,
    ],
    config.staticBase,
    config.buildBase,
    {
      verbose: showLogs,
      cb: done,
    },
  );
}

// SASS

/**
 * Compiles Sass core files.
 * @param {Function} done - Callback function to be called when the compilation is done.
 * @returns {object} - The result of the cssCompileFnc function.
 */
function compileSassCore(done) {
  return cssCompileFnc(
    config.sassCore,
    config.sassBuild,
    'bootstrap.css',
    config.postcssPluginsBase,
    {
      cb: done,
    },
  );
}

/**
 * Compiles Sass custom files.
 * @param {Function} done - Callback function to be called when the compilation is done.
 * @returns {object} - The result of the cssCompileFnc function.
 */
function compileSassCustom(done) {
  return cssCompileFnc(
    config.sassCustom,
    config.sassBuild,
    'custom.css',
    config.postcssPluginsBase,
    {
      cb: done,
    },
  );
}

/**
 * Compiles Sass utilities.
 * @param {Function} done - Callback function to be called when the compilation is done.
 * @returns {object} - The result of the cssCompileFnc function.
 */
function compileSassUtils(done) {
  return cssCompileFnc(
    config.sassUtils,
    config.sassBuild,
    'utils.css',
    config.postcssPluginsBase,
    {
      cb: done,
    },
  );
}

// JS

/**
 * Processes JavaScript files.
 * @param {Function} done - Callback function to be called when processing is complete.
 * @returns {void}
 */
function processJs(done) {
  const params = {
    concatFiles: false,
    outputConcatPrefixFileName: 'app',
    cb: done,
  };

  return jsProcessFnc(config.jsFiles, config.jsBuild, params);
}

// Dataset

/**
 * Prepares the dataset for the site.
 * @param {Function} done - The callback function to be called when the dataset preparation is complete.
 * @returns {Promise} A promise that resolves when the dataset preparation is complete.
 */
function datasetPrepareSite(done) {
  return datasetPrepareFnc(`${config.contentBase}/site.md`, config.tempBase, {
    verbose: true,
    cb: (err) => {
      if (err) {
        console.error('Error in datasetPrepareSite:', err);
      }
      done(err);
    },
  });
}

/**
 * Prepares dataset pages.
 * @param {Function} done - The callback function to be called when the dataset pages are prepared.
 * @returns {void}
 */
function datasetPreparePages(done) {
  return datasetPrepareFnc(
    config.datasetPagesSource,
    config.datasetPagesBuild,
    {
      verbose: showLogs,
      cb: done,
    },
  );
}

// Templates

/**
 * Builds the pages using the specified parameters.
 * @param {Function} done - The callback function to be called when the build is complete.
 * @returns {object} - The result of the htmlBuildFnc function.
 */
function buildPages(done) {
  const params = {
    input: `${config.tplPagesBase}/**/*.html`,
    output: config.tplBuild,
    templates: config.tplTemplatesBase,
    processPaths: [config.tplPagesBase, config.tplTemplatesBase],
    siteConfig: `${config.tempBase}/site.json`,
    dataSource: config.datasetPagesBuild,
    injectCdnJs: config.injectCdnJs,
    injectJs: config.injectJs,
    injectCss: config.injectCss,
    injectIgnorePath: config.buildBase.replace('./', ''),
    cb: done,
  };

  return htmlBuildFnc(params);
}

// GFX

/**
 * Optimizes images in different formats (jpg, png, svg).
 * @param {Function} done - Callback function to be called when the task is complete.
 * @returns {Function} - The callback function passed as a parameter.
 */
function images(done) {
  const params = {
    verbose: showLogs,
    cb: done,
  };

  imagesOptimizeFnc.optimizeJpg(config.imagesJpg, config.gfxBuild, params);
  imagesOptimizeFnc.optimizePng(config.imagesPng, config.gfxBuild, params);
  imagesOptimizeFnc.optimizeSvg(config.imagesSvg, config.gfxBuild, params);

  return done();
}

// Fonts

/**
 * Loads fonts using the specified configuration.
 * @param {Function} done - The callback function to be called when the font loading is complete.
 * @returns {void}
 */
function fontLoad(done) {
  fontLoadFnc(config.fontloadFile, config.tempBase, {
    config: config.fontLoadConfig,
    verbose: showLogs,
    cb: done,
  });
}

// Watch
// --------------

/**
 * Watches files for changes and triggers corresponding tasks.
 */
function watchFiles() {
  // Watch SASS
  gulp.watch(
    config.sassCustom,
    gulp.series(compileSassCustom, hotReload.browserSyncRefresh),
  );
  gulp.watch(
    config.sassCore,
    gulp.series(compileSassCore, hotReload.browserSyncRefresh),
  );
  gulp.watch(
    config.sassUtils,
    gulp.series(compileSassUtils, hotReload.browserSyncRefresh),
  );

  // Watch JS
  gulp.watch(
    config.jsFiles,
    gulp.series(processJs, hotReload.browserSyncRefresh),
  );

  // Watch Templates
  gulp
    .watch(['./src/templates/**/*.*', './src/pages/**/*.*'], buildPages)
    .on('change', hotReload.browserSyncReload);

  // Watch Datasets
  gulp
    .watch(
      './content/**/*.md',
      gulp.series(datasetPrepareSite, datasetPreparePages, buildPages),
    )
    .on('change', hotReload.browserSyncReload);

  // Watch GFX
  gulp.watch(config.gfxBase, gulp.series(images, hotReload.browserSyncRefresh));
}

// Gulp tasks
// --------------

export const css = gulp.parallel(
  compileSassCore,
  compileSassCustom,
  compileSassUtils,
);
export const js = processJs;
export const dataset = gulp.parallel(datasetPrepareSite, datasetPreparePages);
export const html = gulp.series(
  datasetPrepareSite,
  datasetPreparePages,
  buildPages,
);
export const gfx = images;
export const fonts = fontLoad;
export const todo = todoFnc;

// Aliases
export const serve = gulp.series(
  cleanFolders,
  images,
  copyStatic,
  datasetPrepareSite,
  datasetPreparePages,
  fontLoad,
  compileSassCore,
  compileSassCustom,
  compileSassUtils,
  processJs,
  buildPages,
  todoFnc,
  gulp.parallel(watchFiles, hotReload.browserSyncInit),
);

export const watch = gulp.series(serve);
export default serve;
