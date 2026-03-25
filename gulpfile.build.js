/* eslint-disable jsdoc/require-jsdoc */
import { parallel, series, task } from 'gulp'

import * as config from './gulp/config.js'
import cleanFnc from './gulp/tasks/clean.js'
import cssCompileFnc from './gulp/tasks/compile-sass.build.js'
import copyStaticFnc from './gulp/tasks/copy-static.js'
import datasetPrepareFnc from './gulp/tasks/dataset-prepare.js'
import faviconsFnc from './gulp/tasks/favicons.js'
import fontLoadFnc from './gulp/tasks/font-load.js'
import htmlBuildFnc from './gulp/tasks/html-build.js'
import {
  optimizeJpg,
  optimizePng,
  optimizeSvg,
} from './gulp/tasks/optimize-images.js'
import jsProcessFnc from './gulp/tasks/process-js.js'

process.env.BUILD_MODE = process.env.BUILD_MODE || 'build'

const showLogs = false

function cleanFolders() {
  return cleanFnc([config.tempBase, config.buildBase()])
}

async function copyStatic() {
  return copyStaticFnc(
    [
      `${config.staticBase}/*`,
      `${config.staticBase}/**/*`,
      `${config.staticBase}/.*/*`,
    ],
    config.staticBase,
    config.buildBase(),
    {
      verbose: showLogs,
    }
  )
}

async function htmlValidate() {
  // This function is not yet implemented.
  console.log('HTML validation: Skipped (not implemented)')
}

async function compileSassAll() {
  return cssCompileFnc(
    [config.sassCore, config.sassCustom, config.sassUtils],
    config.sassBuild(),
    'index.css',
    config.postcssPluginsBase(),
    {
      verbose: showLogs,
      sourceMaps: false,
      minify: true,
    }
  )
}

async function purgecss() {
  // This function is not yet implemented.
  console.log('PurgeCSS: Skipped (not implemented)')
}

async function processJs() {
  const params = {
    concatFiles: true,
    outputConcatPrefixFileName: 'app',
    sourceMaps: false,
  }

  return jsProcessFnc(config.jsFiles, config.jsBuild(), params)
}

async function datasetPrepareSite() {
  return datasetPrepareFnc(config.siteConfigFile, config.tempBase, {
    verbose: showLogs,
  })
}

async function datasetPreparePages() {
  return datasetPrepareFnc(
    config.datasetPagesSource,
    config.datasetPagesBuild,
    {
      verbose: showLogs,
    }
  )
}

async function buildPages() {
  const params = {
    input: [
      `${config.datasetPagesBuild}/**/*.json`,
      `${config.routesBase}/**/*.njk`,
    ],
    processPaths: [config.templatesBase, config.routesBase],
    routesBase: config.routesBase,
    dataSource: config.datasetPagesBuild,
    output: config.buildBase(),
    injectCdnJs: config.injectCdnJs(),
    injectJs: config.injectJs(),
    injectCss: config.injectCss(),
    injectIgnorePath: config.buildBase().replace('./', ''),
    sourceMaps: false,
  }

  return htmlBuildFnc(params)
}

async function images() {
  const params = {
    verbose: showLogs,
  }

  await Promise.all([
    optimizeJpg(config.imagesJpg, config.imagesBuild(), params),
    optimizePng(config.imagesPng, config.imagesBuild(), params),
    optimizeSvg(config.imagesSvg, config.imagesBuild(), params),
  ])
}

async function favicons() {
  const buildConfig = config.getBuildConfig()
  return await faviconsFnc(
    `${config.srcBase}/assets/icons/favicons-source.png`,
    `${config.buildBase()}/assets/favicons`,
    buildConfig.faviconGenConfig,
    {
      verbose: showLogs,
    }
  )
}

async function fontLoad() {
  // This function is not yet implemented.
  console.log('Font loading: Skipped (not implemented)')
}

async function replaceHash() {
  // This function is not yet implemented.
  console.log('Hash replacement: Skipped (not implemented)')
}

async function revision() {
  // This function is not yet implemented.
  console.log('Revision: Skipped (not implemented)')
}

async function postbuild() {
  // This function is not yet implemented.
  console.log('Post-build: Completed (no tasks implemented)')
}

// Define the main Gulp tasks.
task('css', compileSassAll)
task('js', processJs)
task('dataset', parallel(datasetPrepareSite, datasetPreparePages))
task('html', series(datasetPrepareSite, datasetPreparePages, buildPages))
task('images', images)
task('fonts', fontLoad)
task('validate', htmlValidate)

// The main build task, which runs all other tasks in the correct order.
task(
  'build',
  series(
    cleanFolders,
    images,
    copyStatic,
    datasetPrepareSite,
    datasetPreparePages,
    favicons,
    fontLoad,
    compileSassAll,
    processJs,
    buildPages,
    purgecss,
    revision,
    replaceHash,
    htmlValidate,
    postbuild
  )
)

// The default task, which is an alias for the build task.
task('default', series('build'))
