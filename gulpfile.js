import { existsSync } from 'node:fs'
import gulp from 'gulp'

import * as config from './gulp/config.js'
import cleanFnc from './gulp/tasks/clean-build.js'
import copyStaticFnc from './gulp/tasks/copy-static.js'
import debugFilesFnc from './gulp/tasks/debug-build.js'
import faviconsFnc from './gulp/tasks/generate-favicons.js'
import revisionTask from './gulp/tasks/generate-revision.js'
import sriHashTask from './gulp/tasks/generate-sri.js'
import todoFnc from './gulp/tasks/generate-todo.js'
import componentsTask from './gulp/tasks/manage-components.js'
import datasetPrepareFnc from './gulp/tasks/process-data.js'
import fontLoadFnc from './gulp/tasks/process-fonts.js'
import processHtml from './gulp/tasks/process-html.js'
import {
  convertToAvif,
  convertToWebp,
  optimizeJpg,
  optimizePng,
  optimizeSvg,
} from './gulp/tasks/process-images.js'
import processJsFnc from './gulp/tasks/process-js.js'
import cssCompileFnc, {
  compileAllComponentStyles,
  compileRouteStyles,
} from './gulp/tasks/process-sass.js'
import purgeCssTask from './gulp/tasks/purge-css.js'
import {
  initializeServer,
  refreshServer,
  reloadBrowser,
} from './gulp/tasks/serve-site.js'
import { validateHtml } from './gulp/tasks/validate-html.js'
import loggerLib from './gulp/utils/logger.js'

const logger = loggerLib.createLogger('Gulpfile')
const BUILD_MODE = process.env.BUILD_MODE

if (!BUILD_MODE) {
  throw new Error('[Gulpfile] BUILD_MODE must be set.')
}

// Initialize environment variables based on BUILD_MODE with fallback hierarchy
const envFiles = [`.env.${BUILD_MODE}`, '.env.local', '.env']

for (const envFile of envFiles) {
  if (existsSync(envFile)) {
    // Note: Node's loadEnvFile does not overwrite already defined process.env variables,
    // which results in the desired hierarchy priority (Shell > .env.mode > .env.local).
    process.loadEnvFile(envFile)
  }
}

config.getConfig(BUILD_MODE)

const isDevMode = BUILD_MODE === 'dev'
const isBuildMode = BUILD_MODE === 'build'
const isExportMode = BUILD_MODE === 'export'

/**
 * Resolves mode-specific task handler.
 * @param {object} modeMap - Handler map keyed by build mode
 * @returns {Function} Resolved mode handler
 */
function resolveMode(modeMap) {
  const handler = modeMap[BUILD_MODE]
  if (!handler) {
    throw new Error(
      `[Gulpfile] Missing handler for BUILD_MODE '${BUILD_MODE}'.`
    )
  }

  return handler
}

/**
 * Runs individual CSS builds for development mode.
 * @returns {Function} Parallel task execution
 */
function runDevCss() {
  /**
   * Builds core Bootstrap stylesheet.
   * @returns {Promise<void>} Task result
   */
  function cssCore() {
    return cssCompileFnc(
      config.sassCore,
      config.sassBuild(),
      'bootstrap.css',
      config.postcssPluginsBase()
    )
  }

  /**
   * Builds custom project stylesheet.
   * @returns {Promise<void>} Task result
   */
  function cssCustom() {
    return cssCompileFnc(
      [config.sassCustom],
      config.sassBuild(),
      'custom.css',
      config.postcssPluginsBase()
    )
  }

  /**
   * Builds utility stylesheet.
   * @returns {Promise<void>} Task result
   */
  function cssUtils() {
    return cssCompileFnc(
      config.sassUtils,
      config.sassBuild(),
      'utils.css',
      config.postcssPluginsBase()
    )
  }

  /**
   * Builds debug-only stylesheets.
   * @returns {Promise<void>} Parallel task execution
   */
  function cssDebug() {
    const compile = (file, name) =>
      cssCompileFnc(
        `${config.sassBase}/${file}`,
        config.sassBuild(),
        name,
        config.postcssPluginsBase()
      )

    /**
     * @returns {Function} Task function
     */
    function cssDevstack() {
      return compile('u-devstack.scss', 'u-devstack.css')
    }
    return cssDevstack
  }

  return gulp.parallel(
    cssCore,
    cssCustom,
    cssUtils,
    cssDebug(),
    compileAllComponentStyles,
    compileRouteStyles
  )
}

/**
 * Runs merged CSS build for build and export modes.
 * @returns {Promise<void>} Task result
 */
function runBundleCss() {
  const bundleTask = () =>
    cssCompileFnc(
      [
        config.sassCore,
        config.sassCustom,
        config.sassUtils,
        config.sassComponentsGlob,
      ],
      config.sassBuild(),
      'index.css',
      config.postcssPluginsBase(),
      {
        minify: isBuildMode,
        sourceMaps: false,
      }
    )

  return gulp.parallel(bundleTask, compileRouteStyles)
}

/**
 * Runs build-mode dataset preparation.
 * @returns {Promise<void>} Parallel task execution
 */
function runBuildDataset() {
  /**
   * Prepares site metadata dataset.
   * @returns {Promise<void>} Task result
   */
  function datasetSite() {
    return datasetPrepareFnc(config.siteConfigFile, config.tempBase)
  }

  /**
   * Prepares page metadata dataset.
   * @returns {Promise<void>} Task result
   */
  function datasetPages() {
    return datasetPrepareFnc(
      config.datasetPagesSource,
      config.datasetPagesBuild
    )
  }

  return gulp.parallel(datasetSite, datasetPages)()
}

/**
 * Runs page dataset preparation.
 * @returns {Promise<void>} Task result
 */
function runPageDataset() {
  return datasetPrepareFnc(config.datasetPagesSource, config.datasetPagesBuild)
}

/**
 * Task: Clean build and temp folders
 * @returns {Promise<string[]>} List of deleted paths
 */
export function clean() {
  return cleanFnc([`${config.tempBase}/**/*`, config.buildBase()])
}

/**
 * Task: Copy static files
 * @param {Function} done - Gulp completion callback
 * @returns {import('node:stream').Readable} Gulp stream
 */
export function copy(done) {
  const publicCopy = () =>
    copyStaticFnc(
      [`${config.staticBase}/**/*`],
      config.staticBase,
      config.buildBase()
    )

  const assetsCopy = () =>
    copyStaticFnc(
      [`${config.assetsBase}/fonts/**/*`, `${config.assetsBase}/css/fonts.css`],
      config.assetsBase,
      `${config.buildBase()}/assets`
    )

  return gulp.parallel(publicCopy, assetsCopy)(done)
}

/**
 * Task: Compile all Sass
 * @param {Function} done - Gulp callback
 * @returns {import('node:stream').ReadWriteStream|Promise<void>} The result of the task execution.
 */
export function css(done) {
  const taskFunction = resolveMode({
    dev: runDevCss,
    build: runBundleCss,
    export: runBundleCss,
  })

  return taskFunction()(done)
}

/**
 * Task: Process JavaScript
 * @returns {Promise<void>}
 */
export function js() {
  const params = {
    bundle: isBuildMode || isExportMode,
    minify: isBuildMode,
    sourceMaps: isDevMode,
  }
  return processJsFnc(config.jsFiles, config.jsBuild(), params)
}

/**
 * Task: Prepare dataset
 * @returns {Promise<void>}
 */
export async function dataset() {
  const runDatasetByMode = resolveMode({
    dev: runPageDataset,
    build: runBuildDataset,
    export: runPageDataset,
  })

  return runDatasetByMode()
}

/**
 * Task: Build HTML pages
 * @returns {import('node:stream').Readable} Gulp stream
 */
export function html() {
  return processHtml(config)
}

/**
 * Task: Optimize images
 * @returns {Promise<void>}
 */
export async function images() {
  const imgConfig = config.imageOptimizationConfig()

  await optimizeJpg(config.imagesJpg, config.imagesBuild(), imgConfig.jpg)
  await optimizePng(config.imagesPng, config.imagesBuild())
  await optimizeSvg(config.imagesSvg, config.imagesBuild())

  await convertToWebp(
    [config.imagesJpg, config.imagesPng],
    config.imagesBuild(),
    imgConfig.webp
  )
  await convertToAvif(
    [config.imagesJpg, config.imagesPng],
    config.imagesBuild(),
    imgConfig.avif
  )
}

/**
 * Task: Generate favicons
 * @returns {Promise<void>}
 */
export function favicons() {
  return faviconsFnc(
    `${config.srcBase}/assets/icons/favicons-source.png`,
    config.faviconBuild(),
    config.faviconGenConfig
  )
}

/**
 * Task: Load fonts
 * @returns {import('node:stream').Readable} Gulp stream
 */
export function fonts() {
  return fontLoadFnc(config.fontloadFile, config.assetsBase, {
    config: config.fontLoadConfig(),
  })
}

/**
 * Task: Purge unused CSS
 * @returns {import('node:stream').Readable} Gulp stream
 */
export function purge() {
  return purgeCssTask(
    `${config.sassBuild()}/index.css`,
    `${config.buildBase()}/**/*.html`,
    config.sassBuild()
  )
}

/**
 * Task: Asset Revisioning
 * @returns {Promise<void>}
 */
export function revision() {
  return revisionTask({
    inputAssets: [
      `${config.buildBase()}/assets/css/**/*.css`,
      `${config.buildBase()}/assets/js/**/*.js`,
    ],
    inputHtml: `${config.buildBase()}/**/*.html`,
    buildBase: config.buildBase(),
    manifestPath: `${config.tempBase}/rev-manifest.json`,
  })
}

/**
 * Task: SRI Hashing
 * @returns {import('node:stream').Readable} Gulp stream
 */
export function sri() {
  return sriHashTask(`${config.buildBase()}/**/*.html`, config.buildBase())
}

/**
 * Task: HTML Validation
 * @returns {import('node:stream').Readable} Gulp stream
 */
export function validate() {
  return validateHtml(`${config.buildBase()}/**/*.html`)
}

/**
 * Task: Debug files list
 * @returns {Promise<void>}
 */
export function debug() {
  return debugFilesFnc()
}

/**
 * Task: Generate TODO list
 * @returns {import('node:stream').Readable} Gulp stream
 */
export function todo() {
  return todoFnc()
}

/**
 * Watcher: Monitor files for changes
 * @returns {void}
 */
function watchFiles() {
  try {
    initializeServer()
    gulp.watch(config.sassWatch, gulp.series(css, refreshServer))
    gulp.watch(config.jsFiles, gulp.series(js, refreshServer))
    gulp.watch(`${config.imagesBase}/**/*`, gulp.series(images, refreshServer))
    gulp.watch(
      `${config.iconsBase}/**/*.svg`,
      gulp.series(dataset, html, reloadBrowser)
    )
    gulp
      .watch(config.templateWatchPaths, gulp.series(dataset, html))
      .on('change', reloadBrowser)
  } catch (error) {
    logger.error('Failed to start development server or watchers:', error)
    throw error
  }
}

const buildPipeline = gulp.series(
  clean,
  images,
  copy,
  dataset,
  favicons,
  fonts,
  gulp.parallel(css, js),
  html,
  purge,
  revision,
  sri,
  validate
)

const exportPipeline = gulp.series(
  clean,
  copy,
  favicons,
  fonts,
  dataset,
  css,
  js,
  html,
  purge,
  images,
  validate
)

const servePipeline = gulp.series(
  clean,
  images,
  copy,
  dataset,
  fonts,
  gulp.parallel(css, js),
  html,
  debug,
  todo,
  watchFiles
)

const defaultTask = resolveMode({
  dev: servePipeline,
  build: buildPipeline,
  export: exportPipeline,
})

export {
  componentsTask as components,
  defaultTask as default,
  servePipeline as dev,
  buildPipeline as build,
  exportPipeline as export,
  validate as htmlValidate,
}
