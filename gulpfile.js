/* eslint-disable max-lines -- This file is the top-level orchestrator for the three pipelines and their public gulp task exports. */
import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import gulp from 'gulp'

import { resolveConfig } from './gulp/config.js'
import cleanTask from './gulp/tasks/clean-build.js'
import copyStatic from './gulp/tasks/copy-static.js'
import debugFiles from './gulp/tasks/debug-build.js'
import faviconsTask from './gulp/tasks/generate-favicons.js'
import revisionTask from './gulp/tasks/generate-revision.js'
import sriTask from './gulp/tasks/generate-sri.js'
import lintTemplates from './gulp/tasks/lint-templates.js'
import processDataTask from './gulp/tasks/process-data.js'
import fontLoad from './gulp/tasks/process-fonts.js'
import processHtml from './gulp/tasks/process-html.js'
import imageTasks from './gulp/tasks/process-images.js'
import { processAllJs } from './gulp/tasks/process-js.js'
import {
  compileBootstrapStyles,
  compileProjectStyles,
  compileRouteStyles,
  processAllSass,
} from './gulp/tasks/process-sass.js'
import purgeCss from './gulp/tasks/purge-css.js'
import serveSite from './gulp/tasks/serve-site.js'
import validateHtml from './gulp/tasks/validate-html.js'
import { writeLocalImageCatalog } from './gulp/utils/image-catalog.js'
import loggerLib, { cleanupDir } from './gulp/utils/index.js'
import { getSiteDataArtifactPath } from './gulp/utils/route-data.js'
import { siteDefaults } from './src/config/site.js'

const logger = loggerLib.createLogger('Gulpfile')
const BUILD_MODE = process.env.BUILD_MODE
const VALID_BUILD_MODES = new Set(['dev', 'build', 'export'])

if (!VALID_BUILD_MODES.has(BUILD_MODE)) {
  throw new Error(`Unsupported BUILD_MODE: ${BUILD_MODE ?? '<unset>'}.`, {
    cause: new Error('Pass BUILD_MODE=dev|build|export environment variable.'),
  })
}

// Initialize environment variables from .env files
const envFiles = [`.env.${BUILD_MODE}`, '.env.local', '.env']

envFiles
  .filter((file) => existsSync(file))
  .forEach((file) => process.loadEnvFile(file))

const config = resolveConfig(BUILD_MODE)
let pendingCssReloadPaths = []

function normalizeWrittenFiles(writtenFiles) {
  if (!Array.isArray(writtenFiles)) {
    return []
  }

  return writtenFiles.flat().filter(Boolean)
}

function runGulpTask(task) {
  return new Promise(function waitForTask(resolve, reject) {
    task(function complete(error) {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })
}

function rememberCssReloadPaths(writtenFiles) {
  pendingCssReloadPaths = resolveCssReloadPaths(
    config.paths.build,
    normalizeWrittenFiles(writtenFiles)
  )
  return writtenFiles
}

/**
 * Resolves written CSS files to BrowserSync reload paths relative to build root.
 * @param {string} buildRoot - BrowserSync server root.
 * @param {string[]} writtenFiles - Written asset file paths.
 * @returns {string[]} BrowserSync reload paths.
 */
export function resolveCssReloadPaths(buildRoot, writtenFiles) {
  const absoluteBuildRoot = path.resolve(buildRoot)

  return normalizeWrittenFiles(writtenFiles)
    .filter(function isCssAsset(filePath) {
      return filePath.endsWith('.css')
    })
    .map(function toReloadPath(filePath) {
      return path
        .relative(absoluteBuildRoot, path.resolve(filePath))
        .replace(/\\/g, '/')
    })
    .filter(function isWithinBuildRoot(reloadPath) {
      return reloadPath && !reloadPath.startsWith('..')
    })
}

async function generateSiteMetadata(tempBase) {
  const siteDataPath = getSiteDataArtifactPath(tempBase)
  await fs.mkdir(path.dirname(siteDataPath), { recursive: true })
  await fs.writeFile(siteDataPath, JSON.stringify(siteDefaults, null, 2))
}

function createPipelines(tasks) {
  const {
    clean,
    images,
    dataset,
    favicons,
    fonts,
    copy,
    js,
    css,
    html,
    purge,
    revision,
    sri,
    finalCleanup,
    validate,
    debug,
    watchFiles,
  } = tasks

  return {
    buildPipeline: gulp.series(
      clean,
      gulp.parallel(images, dataset, favicons, fonts),
      gulp.parallel(copy, js, css),
      html,
      purge,
      revision,
      sri,
      finalCleanup,
      gulp.parallel(validate, debug)
    ),
    exportPipeline: gulp.series(
      clean,
      gulp.parallel(images, dataset, favicons, fonts),
      gulp.parallel(copy, js, css),
      html,
      purge,
      gulp.parallel(validate, debug)
    ),
    servePipeline: gulp.series(
      clean,
      gulp.parallel(images, dataset, favicons, fonts),
      gulp.parallel(copy, js, css),
      html,
      debug,
      watchFiles
    ),
  }
}

function selectDefaultPipeline(buildMode, taskPipelines) {
  if (buildMode === 'build') {
    return taskPipelines.buildPipeline
  }

  if (buildMode === 'export') {
    return taskPipelines.exportPipeline
  }

  return taskPipelines.servePipeline
}

/**
 * Task: Clean build and temp folders
 * @returns {Promise<string[]>} List of deleted paths
 */
export function clean() {
  return cleanTask([`${config.tempBase}/**/*`, config.paths.build])
}

/**
 * Task: Copy static files
 * @returns {Promise<void>} Resolves when copy is complete
 */
export async function copy() {
  try {
    await runGulpTask(
      gulp.parallel(
        function copyPublicAssetsTask() {
          return copyStatic(
            [`${config.staticBase}/**/*`],
            config.staticBase,
            config.paths.build
          )
        },
        function copyFontsTask() {
          return copyStatic(
            [
              `${config.assetsBase}/fonts/**/*`,
              `${config.assetsBase}/css/fonts*.css`,
            ],
            config.assetsBase,
            `${config.paths.build}/assets`
          )
        }
      )
    )
  } catch (error) {
    logger.error(`Copy task failed: ${error.message}`)
    throw error
  }
}

/**
 * Task: Compile all Sass
 * @returns {Promise<void>} Resolves when Sass is compiled
 */
export function css() {
  return processAllSass(config, BUILD_MODE).then(rememberCssReloadPaths)
}

/**
 * Task: Compile Bootstrap Sass from project variables
 * @returns {Promise<void>} Resolves when Bootstrap CSS is compiled
 */
export function cssBootstrap() {
  return compileBootstrapStyles(config, BUILD_MODE).then(rememberCssReloadPaths)
}

/**
 * Task: Compile shared project Sass
 * @returns {Promise<void>} Resolves when project CSS is compiled
 */
export function cssProject() {
  return compileProjectStyles(config, BUILD_MODE).then(rememberCssReloadPaths)
}

/**
 * Task: Compile route Sass
 * @returns {Promise<void>} Resolves when route CSS is compiled
 */
export function cssRoutes() {
  return compileRouteStyles(config, [], {
    skipNewer: BUILD_MODE === 'dev',
  }).then(rememberCssReloadPaths)
}

/**
 * Task: Process JavaScript
 * @returns {Promise<void>} Resolves when JS is processed
 */
export function js() {
  return processAllJs(config)
}

/**
 * Task: Prepare dataset
 * @type {import('gulp').TaskFunction}
 */
export const dataset = gulp.parallel(
  function generateSiteMetadataTask() {
    return generateSiteMetadata(config.tempBase)
  },
  function processPageDataTask() {
    return processDataTask(config.datasetPagesSource, config.datasetPagesBuild)
  }
)

/**
 * Task: Build HTML pages
 * @returns {Promise<void>} Resolves when HTML is generated
 */
export function html() {
  return processHtml(config)
}

/**
 * Task: Optimize images
 * @returns {Promise<void>} Resolves when images are optimized
 */
export async function images() {
  const imgConfig = config.imageOptimization

  const tasks = [
    imageTasks.jpg(config.imagesJpg, config.paths.images, imgConfig.jpg),
    imageTasks.png(config.imagesPng, config.paths.images),
    imageTasks.svg(config.imagesSvg, config.paths.images),
    config.optimizeImages &&
      imageTasks.webp(
        [config.imagesJpg, config.imagesPng],
        config.paths.images,
        imgConfig.webp
      ),
    config.optimizeImages &&
      imageTasks.avif(
        [config.imagesJpg, config.imagesPng],
        config.paths.images,
        imgConfig.avif
      ),
  ].filter(Boolean)

  await Promise.all(tasks)
  await writeLocalImageCatalog({
    imagesDest: config.paths.images,
    catalogPath: config.paths.imageCatalog,
    cssPath: config.paths.imagePlaceholderCss,
  })
}

/**
 * Task: Generate favicons
 * @returns {import('node:stream').Readable} Gulp stream for favicons
 */
export function favicons() {
  return faviconsTask(
    `${config.srcBase}/assets/icons/favicons-source.png`,
    config.paths.favicons,
    config.faviconGen,
    {
      rootIconPath: config.paths.favicon,
      manifestPath: config.paths.manifest,
      faviconHtmlPath: config.paths.faviconHtml,
      manifestHref: '/manifest.webmanifest',
    }
  )
}

/**
 * Task: Load fonts
 * @returns {Promise<void>} Resolves when fonts are loaded
 */
export function fonts() {
  return fontLoad(config.fontloadFile, config.assetsBase, {
    config: config.fontLoad,
    minify: config.minifyCss,
  })
}

/**
 * Task: Purge unused CSS
 * @returns {Promise<void>} Resolves when CSS is purged
 */
export async function purge() {
  const buildBase = config.paths.build
  return await purgeCss(
    [`${config.paths.sass}/**/*.css`, `!${config.paths.sass}/**/*.min.css`],
    [
      `${config.srcBase}/**/*.njk`,
      `${config.srcBase}/**/*.md`,
      `${config.srcBase}/**/*.js`,
      `${buildBase}/**/*.html`,
    ],
    config.paths.sass
  )
}

/**
 * Task: Asset Revisioning
 * @returns {import('node:stream').Readable} Gulp stream with revved files
 */
export function revision() {
  return revisionTask({
    inputAssets: [
      `${config.paths.sass}/**/*.css`,
      `${config.paths.js}/**/*.js`,
    ],
    inputHtml: `${config.paths.build}/**/*.html`,
    buildBase: config.paths.build,
    manifestPath: `${config.tempBase}/rev-manifest.json`,
  })
}

/**
 * Task: SRI Hashing
 * @returns {Promise<void>} Resolves when hashes are injected
 */
export async function sri() {
  return await sriTask(`${config.paths.build}/**/*.html`, config.paths.build)
}

/**
 * Task: HTML Validation
 * @returns {import('node:stream').Stream} Gulp validation stream
 */
export function validate() {
  return validateHtml(`${config.paths.build}/**/*.html`)
}

/**
 * Task: Debug files list
 * @returns {Promise<void>} Resolves when diagnostic is finished
 */
export function debug() {
  return debugFiles(config)
}

/**
 * Explicit browser reload task for Gulp series
 * @param {function(Error=): void} done - Gulp completion callback.
 * @returns {void}
 */
export function reload(done) {
  serveSite.reload()
  done()
}

/**
 * Explicit CSS refresh task for Gulp series
 * @param {function(Error=): void} done - Gulp completion callback.
 * @returns {void}
 */
export function refreshCss(done) {
  if (pendingCssReloadPaths.length > 0) {
    serveSite.reload(pendingCssReloadPaths)
    pendingCssReloadPaths = []
  }
  done()
}

/**
 * Registers template and markdown rebuild watchers.
 * @param {object} options - Watcher registration options.
 * @param {object} options.config - Resolved project configuration.
 * @param {object} options.tasks - Task functions to run after template changes.
 * @param {object} [options.gulpApi] - Gulp API adapter.
 * @returns {import('chokidar').FSWatcher} Template file watcher.
 */
export function registerTemplateWatcher({ config, tasks, gulpApi = gulp }) {
  const rebuildTemplates = gulpApi.series(
    tasks.lintTemplates,
    tasks.dataset,
    tasks.html,
    tasks.reload
  )
  const templateWatcher = gulpApi.watch(config.templateWatchPaths)

  templateWatcher.on('change', rebuildTemplates)
  templateWatcher.on('add', rebuildTemplates)
  templateWatcher.on('unlink', rebuildTemplates)

  return templateWatcher
}

async function watchFiles() {
  try {
    await serveSite.init(config)

    // Templates & Data: Rebuild JSON and HTML, then FULL RELOAD
    registerTemplateWatcher({
      config,
      tasks: { lintTemplates, dataset, html, reload },
    })

    // Styles: Rebuild only the affected CSS layer, then inject CSS.
    gulp.watch(config.bootstrapWatch, gulp.series(cssBootstrap, refreshCss))
    gulp.watch(config.projectSassWatch, gulp.series(cssProject, refreshCss))
    const routeStyleWatcher = gulp.watch(config.routeSassWatch)
    routeStyleWatcher.on('change', gulp.series(cssRoutes, refreshCss))
    routeStyleWatcher.on('add', gulp.series(cssRoutes, html, reload))
    routeStyleWatcher.on('unlink', gulp.series(cssRoutes, html, reload))

    // Scripts: Rebuild JS and FULL RELOAD (JS usually requires fresh state)
    gulp.watch(config.jsFiles, gulp.series(js, reload))
    const routeJsWatcher = gulp.watch(config.routeJsWatch)
    routeJsWatcher.on('change', gulp.series(js, reload))
    routeJsWatcher.on('add', gulp.series(js, html, reload))
    routeJsWatcher.on('unlink', gulp.series(js, html, reload))

    // Image metadata and LQS classes are rendered into HTML.
    gulp.watch(`${config.imagesBase}/**/*`, gulp.series(images, html, reload))
    gulp.watch(
      `${config.iconsBase}/favicons-source.png`,
      gulp.series(favicons, html, reload)
    )
    gulp.watch(
      `${config.iconsBase}/**/*.svg`,
      gulp.series(dataset, html, reload)
    )
  } catch (error) {
    logger.error('Failed to start development server or watchers:', error)
    throw error
  }
}

async function finalCleanup() {
  await cleanupDir(
    config.paths.sass,
    /-[a-f0-9]{6,}\.(?:min\.)?css$|\.min\.css$|^fonts(?:-[a-f0-9]{6,})?\.min\.css$|^fonts\.css$/,
    'non-fingerprint CSS',
    logger
  )
  await cleanupDir(
    config.paths.js,
    /-[a-f0-9]{6,}\.(?:min\.)?js$|\.min\.js$|^vendor\.js$|^manifest\.js$/,
    'non-fingerprint JS',
    logger
  )
}

const { buildPipeline, exportPipeline, servePipeline } = createPipelines({
  clean,
  images,
  dataset,
  favicons,
  fonts,
  copy,
  js,
  css,
  html,
  purge,
  revision,
  sri,
  finalCleanup,
  validate,
  debug,
  watchFiles,
})

const defaultTask = selectDefaultPipeline(BUILD_MODE, {
  buildPipeline,
  exportPipeline,
  servePipeline,
})

export {
  servePipeline as dev,
  buildPipeline as build,
  exportPipeline as export,
  validate as htmlValidate,
}

export default defaultTask
