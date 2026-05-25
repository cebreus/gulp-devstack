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
import todoTask from './gulp/tasks/generate-todo.js'
import lintTemplates from './gulp/tasks/lint-templates.js'
import processDataTask from './gulp/tasks/process-data.js'
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
import { processAllSass } from './gulp/tasks/process-sass.js'
import purgeCss from './gulp/tasks/purge-css.js'
import {
  initializeServer,
  injectChanges,
  reloadBrowser,
} from './gulp/tasks/serve-site.js'
import { validateHtml } from './gulp/tasks/validate-html.js'
import loggerLib, {
  cleanupDir,
  getSiteDataArtifactPath,
} from './gulp/utils/index.js'
import { siteDefaults } from './src/config/site.js'

const logger = loggerLib.createLogger('Gulpfile')
const BUILD_MODE = process.env.BUILD_MODE

if (!BUILD_MODE) {
  throw new Error('BUILD_MODE must be set.', {
    cause: new Error('Pass BUILD_MODE=dev|build|export environment variable.'),
  })
}

// Initialize environment variables from .env files
;[`.env.${BUILD_MODE}`, '.env.local', '.env']
  .filter((file) => existsSync(file))
  .forEach((file) => process.loadEnvFile(file))

const config = resolveConfig(BUILD_MODE)

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
  /**
   * Copies public static assets
   * @returns {import('node:stream').Readable} Gulp stream
   */
  function copyPublicAssets() {
    return copyStatic(
      [`${config.staticBase}/**/*`],
      config.staticBase,
      config.paths.build
    )
  }

  /**
   * Copies fonts and associated CSS
   * @returns {import('node:stream').Readable} Gulp stream
   */
  function copyFonts() {
    return copyStatic(
      [
        `${config.assetsBase}/fonts/**/*`,
        `${config.assetsBase}/css/fonts*.css`,
      ],
      config.assetsBase,
      `${config.paths.build}/assets`
    )
  }

  try {
    await gulp.parallel(copyPublicAssets, copyFonts)()
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
  return processAllSass(config, BUILD_MODE)
}

/**
 * Task: Process JavaScript
 * @returns {Promise<void>} Resolves when JS is processed
 */
export function js() {
  const params = {
    bundle: config.concatFiles,
    minify: config.minifyJs,
    sourceMaps: config.sourceMaps,
  }
  return processJs(config, config.jsFiles, config.paths.js, params)
}

/** Generates site-wide metadata JSON */
async function generateSiteMetadata() {
  const siteDataPath = getSiteDataArtifactPath(config.tempBase)
  await fs.mkdir(path.dirname(siteDataPath), { recursive: true })
  await fs.writeFile(siteDataPath, JSON.stringify(siteDefaults, null, 2))
}

/**
 * Processes page-level markdown data
 * @returns {import('node:stream').Readable} Gulp stream
 */
function processPageData() {
  return processDataTask(config.datasetPagesSource, config.datasetPagesBuild)
}

/**
 * Task: Prepare dataset
 * @type {import('gulp').TaskFunction}
 */
export const dataset = gulp.parallel(generateSiteMetadata, processPageData)

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
    optimizeJpg(config.imagesJpg, config.paths.images, imgConfig.jpg),
    optimizePng(config.imagesPng, config.paths.images),
    optimizeSvg(config.imagesSvg, config.paths.images),
    config.optimizeImages &&
      convertToWebp(
        [config.imagesJpg, config.imagesPng],
        config.paths.images,
        imgConfig.webp
      ),
    config.optimizeImages &&
      convertToAvif(
        [config.imagesJpg, config.imagesPng],
        config.paths.images,
        imgConfig.avif
      ),
  ].filter(Boolean)

  await Promise.all(tasks)
}

/**
 * Task: Generate favicons
 * @returns {import('node:stream').Readable} Gulp stream for favicons
 */
export function favicons() {
  return faviconsTask(
    `${config.srcBase}/assets/icons/favicons-source.png`,
    config.paths.favicons,
    config.faviconGen
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
 * Task: Generate TODO list
 * @returns {Promise<void>} Resolves when TODO report is updated
 */
export function todo() {
  return todoTask()
}

/**
 * Explicit browser reload task for Gulp series
 * @returns {void}
 */
export function reload() {
  reloadBrowser()
}

/**
 * Explicit browser injection task for Gulp series (e.g. CSS)
 * @returns {import('node:stream').ReadWriteStream} BrowserSync stream
 */
export function inject() {
  return injectChanges()
}

/**
 * Watcher: Monitor files for changes
 * @returns {Promise<void>} Resolves after the dev server and watchers are initialized
 */
async function watchFiles() {
  try {
    await initializeServer(config)

    // Templates & Data: Rebuild JSON and HTML, then FULL RELOAD
    gulp.watch(
      config.templateWatchPaths,
      gulp.series(lintTemplates, dataset, html, reload)
    )

    // Styles: Rebuild CSS and INJECT (no full reload)
    gulp.watch(config.sassWatch, gulp.series(css, inject))

    // Scripts: Rebuild JS and FULL RELOAD (JS usually requires fresh state)
    gulp.watch(config.jsFiles, gulp.series(js, reload))

    // Assets: Just process and reload browser
    gulp.watch(`${config.imagesBase}/**/*`, gulp.series(images, reload))
    gulp.watch(
      `${config.iconsBase}/**/*.svg`,
      gulp.series(dataset, html, reload)
    )
  } catch (error) {
    logger.error('Failed to start development server or watchers:', error)
    throw error
  }
}

/**
 * Final cleanup: remove non-fingerprint files
 * @returns {Promise<void>} Resolves when cleanup is finished
 */
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

const buildPipeline = gulp.series(
  clean,
  gulp.parallel(images, dataset, favicons, fonts),
  gulp.parallel(copy, js, css),
  html,
  purge,
  revision,
  sri,
  finalCleanup,
  gulp.parallel(validate, debug, todo)
)

const exportPipeline = gulp.series(
  clean,
  gulp.parallel(images, dataset, favicons, fonts),
  gulp.parallel(copy, js, css),
  html,
  purge,
  gulp.parallel(validate, debug, todo)
)

const servePipeline = gulp.series(
  clean,
  gulp.parallel(images, dataset, fonts),
  gulp.parallel(copy, js, css),
  html,
  debug,
  todo,
  watchFiles
)

let defaultTask = servePipeline
if (BUILD_MODE === 'build') defaultTask = buildPipeline
if (BUILD_MODE === 'export') defaultTask = exportPipeline

export {
  servePipeline as dev,
  buildPipeline as build,
  exportPipeline as export,
  validate as htmlValidate,
}

export default defaultTask
