/* eslint-disable jsdoc/require-jsdoc */
import gulp from 'gulp';
import fs from 'fs';

// Import logger from our utils instead of duplicating log behaviors
import logger from './gulp/utils/logger.js';

import * as config from './gulp/config/gulpconfig.js';

import cleanFnc from './gulp/tasks/clean.js';
import cssCompileFnc from './gulp/tasks/compile-sass.js';
import copyStaticFnc from './gulp/tasks/copy-static.js';
import datasetPrepareFnc from './gulp/tasks/dataset-prepare.js';
import fontLoadFnc from './gulp/tasks/font-load.js';
import * as hotReload from './gulp/tasks/hotreload.js';
import buildHtmlPages from './gulp/tasks/html-pages-build.js';
import * as imagesOptimizeFnc from './gulp/tasks/optimize-images.js';
import todoFnc from './gulp/tasks/todo.js';
import debugFilesFnc from './gulp/tasks/debug-files.js';
import processJsFnc from './gulp/tasks/process-js.js';

// Variables
// --------------
// Initialize log level based on environment
const logLevel = process.env.LOG_LEVEL || 'info';
logger.setLevel(logLevel);

// Gulp functions
// --------------
function cleanFolders() {
  return cleanFnc(config.buildBase);
}

function copyStatic(done) {
  return copyStaticFnc(
    [
      `${config.staticBase}/*`,
      `${config.staticBase}/**/*`,
      `${config.staticBase}/.*/*`,
    ],
    config.staticBase,
    config.buildBase, {
      cb: done,
    },
  );
}

// SASS
function compileSassCore(done) {
  // Use logger.debug for detailed logging and logger.info for standard messages
  logger.debug('Compiling bootstrap.css from:', config.sassCore);

  return cssCompileFnc(
    config.sassCore,
    config.sassBuild,
    'bootstrap.css',
    config.postcssPluginsBase, {
      cb: () => {
        logger.info('Bootstrap CSS compiled successfully to:',
          `${config.sassBuild}/bootstrap.css`);
        done();
      },
    },
  );
}

function compileSassCustom(done) {
  return cssCompileFnc(
    [config.sassCustom],
    config.sassBuild,
    'custom.css',
    config.postcssPluginsBase, {
      cb: done,
    },
  );
}

function compileSassUtils(done) {
  return cssCompileFnc(
    config.sassUtils,
    config.sassBuild,
    'utils.css',
    config.postcssPluginsBase, {
      cb: done,
    },
  );
}

// JS
function processJs(done) {
  const params = {
    concatFiles: false,
    outputConcatPrefixFileName: 'app',
    cb: done,
  };

  return processJsFnc(config.jsFiles, config.jsBuild, params);
}

// Dataset
function datasetPreparePages(done) {
  return datasetPrepareFnc(
    `${config.routesBase}/**/*.md`, // Explicitně hledáme markdown soubory v routes
    config.datasetPagesBuild, {
      cb: done,
    },
  );
}

// Templates
export function buildPages(cb) {
  return buildHtmlPages(config, cb);
}

// GFX
async function images(done) {
  const params = {
    path: config.buildBase,
  };

  // Make sure the image build directory exists
  if (!fs.existsSync(config.imagesBuild)) {
    fs.mkdirSync(config.imagesBuild, {
      recursive: true
    });
    logger.debug(`Created images build directory: ${config.imagesBuild}`);
  }

  try {
    // Run image optimizations in parallel and wait for all to complete
    await Promise.all([
      imagesOptimizeFnc.optimizeJpg(config.imagesJpg, config.imagesBuild,
        params),
      imagesOptimizeFnc.optimizePng(config.imagesPng, config.imagesBuild,
        params),
      imagesOptimizeFnc.optimizeSvg(config.imagesSvg, config.imagesBuild,
        params)
    ]);

    done();
  } catch (error) {
    logger.error('Error during image optimization:', error);
    done(error);
  }
}

// Fonts
function fontLoad(done) {
  fontLoadFnc(config.fontloadFile, config.tempBase, {
    config: config.fontLoadConfig,
    cb: done,
  });
}

// Diagnostická úloha
export function debugFiles(done) {
  debugFilesFnc();
  done();
}

// Watch
// --------------
function watchFiles() {
  // Watch SASS - use config paths instead of hardcoded
  gulp.watch(
    config.sassWatch,
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

  // Watch Templates, Routes and Markdown content - use config paths
  gulp
    .watch(
      config.templateWatchPaths,
      gulp.series(datasetPreparePages, buildPages)
    )
    .on('change', hotReload.browserSyncReload);

}

// Gulp tasks
// --------------
export const css = gulp.parallel(
  compileSassCore,
  compileSassCustom,
  compileSassUtils,
);
export const js = processJs;
export const dataset = datasetPreparePages;
export const html = gulp.series(
  datasetPreparePages,
  buildPages,
);
export const gfx = images;
export const fonts = fontLoad;
export const todo = todoFnc;

// Development workflow - keep this focused on development needs
export const serve = gulp.series(
  cleanFolders,
  images,
  copyStatic,
  datasetPreparePages,
  fontLoad,
  compileSassCore,
  compileSassCustom,
  compileSassUtils,
  processJs,
  buildPages,
  debugFiles,
  todoFnc,
  gulp.parallel(watchFiles, hotReload.browserSyncInit),
);

export const watch = gulp.series(serve);


export default serve;
