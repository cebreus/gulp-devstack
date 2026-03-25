/* eslint-disable jsdoc/require-jsdoc */
import { series } from 'gulp'

import * as config from './gulp/config.js'
import cleanFnc from './gulp/tasks/clean.js'
import cssCompileFnc from './gulp/tasks/compile-sass.export.js'
import copyStaticFnc from './gulp/tasks/copy-static.js'
import datasetPrepareFnc from './gulp/tasks/dataset-prepare.js'
import generateFaviconsFnc from './gulp/tasks/favicons.js'
import fontLoadFnc from './gulp/tasks/font-load.js'
import buildHtmlPages from './gulp/tasks/html-pages-build.js'
import * as imagesOptimizeFnc from './gulp/tasks/optimize-images.js'
import jsProcessFnc from './gulp/tasks/process-js.js'
import { mkdirr } from './gulp/utils/helpers.js'

process.env.BUILD_MODE = process.env.BUILD_MODE || 'export'

export function cleanFolders() {
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

export async function compileSassAll() {
  return new Promise((resolve, reject) => {
    cssCompileFnc(
      [config.sassCore, config.sassCustom, config.sassUtils],
      config.sassBuild(),
      'index.css',
      config.postcssPluginsBase()
    )
      .then((stream) => {
        stream.on('end', resolve)
        stream.on('error', reject)
      })
      .catch(reject)
  })
}

export async function processJs() {
  const params = {
    concatFiles: config.concatFiles(),
    outputConcatPrefixFileName: 'app',
  }
  return jsProcessFnc(config.jsFiles, config.jsBuild(), params)
}

export function datasetPreparePages() {
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

export function favicons() {
  return generateFaviconsFnc(
    `${config.srcBase}/assets/icons/favicons-source.png`,
    config.faviconBuild(),
    config.faviconGenConfig
  )
}

async function fontLoad() {
  return fontLoadFnc(config.fontloadFile, config.tempBase, {
    config: config.fontLoadConfig(),
  })
}

// The main export build task.
export const build = series(
  cleanFolders,
  copyStatic,
  favicons,
  fontLoad,
  compileSassAll,
  processJs,
  buildPages,
  images
)

export default build

export {
  cleanFolders as clean,
  copyStatic as copy,
  compileSassAll as css,
  datasetPreparePages as dataset,
  fontLoad as fonts,
  buildPages as html,
  images,
  favicons as ico,
  processJs as js,
}
