import { existsSync } from 'node:fs'
import gulp from 'gulp'

import * as config from './gulp/config.js'
import cleanTask from './gulp/tasks/clean-build.js'
import copyStatic from './gulp/tasks/copy-static.js'
import debugFiles from './gulp/tasks/debug-build.js'
import faviconsTask from './gulp/tasks/generate-favicons.js'
import revisionTask from './gulp/tasks/generate-revision.js'
import sriTask from './gulp/tasks/generate-sri.js'
import todoTask from './gulp/tasks/generate-todo.js'
import componentsTask from './gulp/tasks/manage-components.js'
import datasetPrepare from './gulp/tasks/process-data.js'
import fontLoad from './gulp/tasks/process-fonts.js'
import processHtml from './gulp/tasks/process-html.js'
import {
  convertToAvif,
  convertToWebp,
  optimizeJpg,
  optimizePng,
  optimizeSvg,
} from './gulp/tasks/process-images.js'
import processJs from './gulp/tasks/process-js.js'
import compileSass, {
  compileAllComponentStyles,
  compileIsolatedComponentStyles,
  compileRouteStyles,
} from './gulp/tasks/process-sass.js'
import purgeCss from './gulp/tasks/purge-css.js'
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

// Initialize configuration based on BUILD_MODE

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
 * Factory for core CSS tasks shared across modes.
 * @returns {object} Map of task functions
 */
function buildCssCoreTasks() {
  /**
   * Builds core Bootstrap stylesheet.
   * @returns {Promise<void>} Task result
   */
  function cssCore() {
    return compileSass(
      config.sassCore,
      config.sassBuild(),
      'bootstrap.css',
      config.postcssPluginsBase(),
      {
        minify: config.minifyCss(),
        sourceMaps: false,
      }
    )
  }

  /**
   * Builds custom project stylesheet.
   * @returns {Promise<void>} Task result
   */
  function cssCustom() {
    return compileSass(
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
    return compileSass(
      config.sassUtils,
      config.sassBuild(),
      'utils.css',
      config.postcssPluginsBase()
    )
  }

  return { cssCore, cssCustom, cssUtils }
}

/**
 * Builds debug-only stylesheets.
 * @returns {Promise<void>} Task result
 */
function cssDevstack() {
  return compileSass(
    `${config.sassBase}/u-devstack.scss`,
    config.sassBuild(),
    'u-devstack.css',
    config.postcssPluginsBase()
  )
}

/**
 * Runs individual CSS builds for development mode.
 * @returns {Function} Parallel task execution
 */
function runDevCss() {
  const { cssCore, cssCustom, cssUtils } = buildCssCoreTasks()

  return gulp.parallel(
    cssCore,
    cssCustom,
    cssUtils,
    cssDevstack,
    compileAllComponentStyles,
    compileRouteStyles
  )
}

/**
 * Runs merged CSS build for build and export modes.
 * @returns {Promise<void>} Task result
 */
function runBundleCss() {
  /**
   * Builds the merged index.css.
   * @returns {import('node:stream').ReadWriteStream} Gulp stream
   */
  function bundleCss() {
    return compileSass(
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
        minify: config.minifyCss(),
        sourceMaps: false,
      }
    )
  }

  return gulp.parallel(bundleCss, compileRouteStyles)
}

/**
 * Runs isolated CSS compilation for export mode (CMS handoff).
 * @returns {Promise<void>} Task result
 */
function runExportCss() {
  const { cssCore, cssCustom, cssUtils } = buildCssCoreTasks()

  return gulp.parallel(
    cssCore,
    cssCustom,
    cssUtils,
    compileIsolatedComponentStyles,
    compileRouteStyles
  )
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
    return datasetPrepare(config.siteConfigFile, config.tempBase)
  }

  /**
   * Prepares page metadata dataset.
   * @returns {Promise<void>} Task result
   */
  function datasetPages() {
    return datasetPrepare(config.datasetPagesSource, config.datasetPagesBuild)
  }

  return gulp.parallel(datasetSite, datasetPages)()
}

/**
 * Runs page dataset preparation.
 * @returns {Promise<void>} Task result
 */
function runPageDataset() {
  return datasetPrepare(config.datasetPagesSource, config.datasetPagesBuild)
}

/**
 * Task: Clean build and temp folders
 * @returns {Promise<string[]>} List of deleted paths
 */
export function clean() {
  return cleanTask([`${config.tempBase}/**/*`, config.buildBase()])
}

/**
 * Task: Copy static files
 * @param {Function} done - Gulp completion callback
 * @returns {import('node:stream').Readable} Gulp stream
 */
export function copy(done) {
  /**
   * Copies public folder static files.
   * @returns {import('node:stream').Readable} Gulp stream
   */
  function publicCopy() {
    return copyStatic(
      [`${config.staticBase}/**/*`],
      config.staticBase,
      config.buildBase()
    )
  }

  /**
   * Copies asset folder fonts and CSS.
   * @returns {import('node:stream').Readable} Gulp stream
   */
  function assetsCopy() {
    return copyStatic(
      [`${config.assetsBase}/fonts/**/*`, `${config.assetsBase}/css/fonts.css`],
      config.assetsBase,
      `${config.buildBase()}/assets`
    )
  }

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
    export: runExportCss,
  })

  return taskFunction()(done)
}

/**
 * Task: Process JavaScript
 * @returns {Promise<void>}
 */
export function js() {
  const params = {
    bundle: config.concatFiles(),
    minify: config.minifyJs(),
    sourceMaps: config.sourceMaps(),
  }
  return processJs(config.jsFiles, config.jsBuild(), params)
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
  return faviconsTask(
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
  return fontLoad(config.fontloadFile, config.assetsBase, {
    config: config.fontLoadConfig(),
  })
}

/**
 * Task: Purge unused CSS
 * @returns {import('node:stream').Readable} Gulp stream
 */
export function purge() {
  return purgeCss(
    [`${config.sassBuild()}/**/*.css`, `!${config.sassBuild()}/**/*.min.css`],
    [
      `${config.srcBase}/**/*.njk`,
      `${config.srcBase}/**/*.md`,
      `${config.buildBase()}/**/*.html`,
    ],
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
  return sriTask(`${config.buildBase()}/**/*.html`, config.buildBase())
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
  return debugFiles()
}

/**
 * Task: Generate TODO list
 * @returns {import('node:stream').Readable} Gulp stream
 */
export function todo() {
  return todoTask()
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
  purge, // Ensure CSS is purged before HTML task inlines it
  html,
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
  purge, // Ensure CSS is purged before HTML task inlines it
  html,
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
