/* eslint-disable jsdoc/require-jsdoc */
import gulp from 'gulp'

import * as config from './gulp/config.js'
import cleanFnc from './gulp/tasks/clean.js'
import cssCompileFnc from './gulp/tasks/compile-sass.js'
import componentManager from './gulp/tasks/component-task.js'
import compileAllComponentStyles from './gulp/tasks/components-sass.js'
import copyStaticFnc from './gulp/tasks/copy-static.js'
import datasetPrepareFnc from './gulp/tasks/dataset-prepare.js'
import debugFilesFnc from './gulp/tasks/debug-files.js'
import fontLoadFnc from './gulp/tasks/font-load.js'
import * as hotReload from './gulp/tasks/hotreload.js'
import buildHtmlPages from './gulp/tasks/html-pages-build.js'
import * as imagesOptimizeFnc from './gulp/tasks/optimize-images.js'
import processJsFnc from './gulp/tasks/process-js.js'
import todoFnc from './gulp/tasks/todo.js'
import { mkdirr } from './gulp/utils/helpers.js'
import logger from './gulp/utils/logger.js'
import pc from 'picocolors'

process.env.BUILD_MODE = process.env.BUILD_MODE || 'dev'

function cleanFolders() {
  return cleanFnc([config.tempBase, config.buildBase()])
}

async function copyStatic() {
  return copyStaticFnc(
    [
      `${config.staticBase}/*`,
      `${config.staticBase}/**/*`,
      `${config.staticBase}/.*`,
      `${config.staticBase}/.*/*`,
    ],
    config.staticBase,
    config.buildBase()
  )
}

async function compileSassCore() {
  logger.debug(`[CoreCSS] Compiling from: ${pc.yellow(config.sassCore)}`)
  return new Promise((resolve, reject) => {
    cssCompileFnc(
      config.sassCore,
      config.sassBuild(),
      'bootstrap.css',
      config.postcssPluginsBase()
    )
      .then((stream) => {
        stream.on('end', resolve)
        stream.on('error', reject)
      })
      .catch(reject)
  })
}

async function compileSassCustom() {
  logger.debug(`[CustomCSS] Compiling from: ${pc.yellow(config.sassCustom)}`)
  return new Promise((resolve, reject) => {
    cssCompileFnc(
      [config.sassCustom],
      config.sassBuild(),
      'custom.css',
      config.postcssPluginsBase()
    )
      .then((stream) => {
        stream.on('end', resolve)
        stream.on('error', reject)
      })
      .catch(reject)
  })
}

async function compileSassUtils() {
  logger.debug(`[UtilsCSS] Compiling from: ${pc.yellow(config.sassUtils)}`)
  return new Promise((resolve, reject) => {
    cssCompileFnc(
      config.sassUtils,
      config.sassBuild(),
      'utils.css',
      config.postcssPluginsBase()
    )
      .then((stream) => {
        stream.on('end', resolve)
        stream.on('error', reject)
      })
      .catch(reject)
  })
}

const compileAllSass = gulp.parallel(
  compileSassCore,
  compileSassCustom,
  compileSassUtils,
  compileAllComponentStyles
)

async function processJs() {
  const params = {
    concatFiles: false,
    outputConcatPrefixFileName: 'app',
  }
  await processJsFnc(config.jsFiles, config.jsBuild(), params)
}

async function datasetPreparePages() {
  return datasetPrepareFnc(config.datasetPagesSource, config.datasetPagesBuild)
}

async function buildPages() {
  return buildHtmlPages(config)
}

async function images() {
  const params = {
    path: config.buildBase(),
  }

  mkdirr(config.imagesBuild())

  await Promise.all([
    imagesOptimizeFnc.optimizeJpg(
      config.imagesJpg,
      config.imagesBuild(),
      params
    ),
    imagesOptimizeFnc.optimizePng(
      config.imagesPng,
      config.imagesBuild(),
      params
    ),
    imagesOptimizeFnc.optimizeSvg(
      config.imagesSvg,
      config.imagesBuild(),
      params
    ),
  ])
}

async function fontLoad() {
  return fontLoadFnc(config.fontloadFile, config.tempBase, {
    config: config.fontLoadConfig(),
  })
}

function debugFiles() {
  return debugFilesFnc()
}

async function watchFiles() {
  try {
    hotReload.browserSyncInit()
    gulp.watch(
      config.sassWatch,
      gulp.series(compileSassCustom, hotReload.browserSyncRefresh)
    )
    gulp.watch(
      config.sassCore,
      gulp.series(compileSassCore, hotReload.browserSyncRefresh)
    )
    gulp.watch(
      config.sassUtils,
      gulp.series(compileSassUtils, hotReload.browserSyncRefresh)
    )
    gulp.watch(
      config.jsFiles,
      gulp.series(processJs, hotReload.browserSyncRefresh)
    )
    gulp
      .watch(
        config.templateWatchPaths,
        gulp.series(datasetPreparePages, buildPages)
      )
      .on('change', hotReload.browserSyncReload)
  } catch (error) {
    logger.error('Failed to start development server or watchers:', error)
    throw error
  }
}

// Ensure all CSS and JS are built before HTML pages
const buildAssets = gulp.parallel(
  compileSassCore,
  compileSassCustom,
  compileSassUtils,
  compileAllComponentStyles,
  processJs
)

export const serve = gulp.series(
  cleanFolders,
  images,
  copyStatic,
  datasetPreparePages,
  fontLoad,
  buildAssets,
  buildPages,
  debugFiles,
  todoFnc,
  watchFiles
)

export const watch = gulp.series(serve)

export {
  cleanFolders as clean,
  componentManager as components,
  copyStatic as copy,
  compileAllSass as css,
  datasetPreparePages as dataset,
  debugFiles as debug,
  serve as default,
  fontLoad as fonts,
  buildPages as html,
  images,
  processJs as js,
  todoFnc as todo,
}
