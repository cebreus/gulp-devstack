import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { globSync } from 'glob'
import gulp from 'gulp'

import loggerLib, {
  attachPipelineLogging,
  buildGlobalContext,
  buildTemplateContext,
  cleanHtmlComments,
  discoverRouteScripts,
  discoverRouteStyles,
  ensureFileIntegrity,
  getMenuDataArtifactPath,
  getPageDataArtifactPath,
  getRelativePath,
  getRouteDataArtifactsDir,
  getSiteDataArtifactPath,
  isPrivateFile,
  resolveInjectionUrl,
  streamToPromise,
  stripXhtmlSlashes,
} from '../utils/index.js'

const logger = loggerLib.createLogger('ProcessHtml')
const DEFAULT_DATE_LOCALE = 'en'
const DEFAULT_DATE_TIMEZONE = 'UTC'

/**
 * Formats a date value for Nunjucks templates.
 * @param {string|Date|null|undefined} input - Date-like input value.
 * @param {string|Intl.DateTimeFormatOptions} [format] - Output format token or Intl options.
 * @returns {string|number} Formatted date value.
 * @private
 */
function formatTemplateDate(input, format) {
  const date = input === 'now' || !input ? new Date() : new Date(input)

  if (isNaN(date.getTime())) {
    return new Date().getFullYear()
  }

  if (format === 'YYYY') {
    return date.getUTCFullYear()
  }

  if (format && typeof format === 'object') {
    return new Intl.DateTimeFormat(DEFAULT_DATE_LOCALE, {
      timeZone: DEFAULT_DATE_TIMEZONE,
      ...format,
    }).format(date)
  }

  return date.toISOString()
}

/**
 * Internal: Loads page-specific JSON data from the temporary directory.
 * @param {import('vinyl')} file - The current Nunjucks template file.
 * @param {object} config - Project configuration.
 * @returns {Promise<object>} Page data object.
 * @private
 */
async function loadPageJson(file, config) {
  const artifactsBase = getRouteDataArtifactsDir(config.tempBase)
  const dataPath = getPageDataArtifactPath({
    artifactsBase,
    routesBase: config.routesBase,
    filePath: file.path,
  })

  try {
    const content = await fs.readFile(dataPath, 'utf8')
    return JSON.parse(content)
  } catch (error) {
    if (error.code === 'ENOENT') {
      logger.debug(`No page data found for: ${file.path}`)
      return {}
    }
    const errorMsg = `Failed to parse page data: ${file.path}`
    logger.error(`${errorMsg}. Cause: ${error.message}`)
    throw new Error(`[ProcessHtml] ${errorMsg}`, { cause: error })
  }
}

/**
 * Internal: Loads and merges global site metadata and navigation menu.
 * @param {object} config - Project configuration.
 * @returns {Promise<object>} Combined site context object.
 * @private
 */
async function loadGlobalContext(config) {
  const artifactsBase = getRouteDataArtifactsDir(config.tempBase)
  const siteDataPath = getSiteDataArtifactPath(config.tempBase)
  const menuDataPath = getMenuDataArtifactPath(artifactsBase)
  let siteData = {}
  let menuData = {}

  try {
    if (existsSync(siteDataPath)) {
      const content = await fs.readFile(siteDataPath, 'utf8')
      siteData = JSON.parse(content)
    }
    if (existsSync(menuDataPath)) {
      const content = await fs.readFile(menuDataPath, 'utf8')
      menuData = JSON.parse(content)
    }
  } catch (error) {
    logger.error(`Failed to load global context. Cause: ${error.message}`)
  }

  return buildGlobalContext({ siteData, menuData })
}

/**
 * Internal: Assigns a numerical priority weight to an asset for injection sorting.
 * @param {string} filepath - The path to the asset.
 * @returns {number} Priority weight.
 * @private
 */
function getAssetWeight(filepath) {
  const name = path.basename(filepath).toLowerCase()
  const weights = {
    fonts: 5,
    bootstrap: 10,
    components: 20,
    custom: 30,
    main: 40,
    utils: 50,
    'u-devstack': 100, // Debugger layer must be last
  }

  for (const [key, weight] of Object.entries(weights)) {
    if (name.includes(key)) return weight
  }

  return 100
}

/**
 * Gulp Task: Renders Nunjucks templates into HTML with injected assets.
 * @param {object} config - Project configuration provider.
 * @returns {Promise<void>} Resolves when HTML generation is complete.
 */
export async function processHtml(config) {
  const { default: data } = await import('gulp-data')
  const { default: inject } = await import('gulp-inject')
  const { default: beautify } = await import('gulp-jsbeautifier')
  const { default: nunjucksRender } = await import('gulp-nunjucks-render')
  const { default: markdown } = await import('markdown-it')
  const { Transform } = await import('node:stream')

  const routesPattern = [
    path.join(config.routesBase, '**/*.njk').replace(/\\/g, '/'),
    `!${path.join(config.routesBase, '**/layout-*.njk').replace(/\\/g, '/')}`,
  ]

  const templatesPath = [
    config.routesBase,
    path.join(config.srcBase, 'lib'),
    config.imagesBase,
    config.iconsBase,
  ]

  // Pre-load shared context and assets once per task run
  const globalContext = await loadGlobalContext(config)
  const assetPaths = config.globalInjectAssets
    .flatMap((pattern) =>
      globSync(path.join(config.paths.build, pattern), { posix: true })
    )
    .sort((a, b) => getAssetWeight(a) - getAssetWeight(b))

  const globalAssets = gulp.src(assetPaths, {
    read: false,
    base: config.paths.build,
    allowEmpty: true,
  })

  const processedFiles = []

  let htmlPipeline = gulp
    .src(routesPattern, { allowEmpty: true })
    .pipe(
      data(async (file) => {
        const relativePath = path.relative(config.routesBase, file.path)
        const pageRelativeDir = path.dirname(relativePath)
        const pageBasename = path.basename(relativePath, '.njk')

        const [pageData, styles, scripts] = await Promise.all([
          loadPageJson(file, config),
          discoverRouteStyles(
            pageRelativeDir,
            pageBasename,
            config.paths.build
          ),
          discoverRouteScripts(
            pageRelativeDir,
            pageBasename,
            config.paths.build
          ),
        ])

        return {
          ...buildTemplateContext({
            pageData,
            globalContext,
            config,
            pageStyles: styles,
            pageScripts: scripts,
            isPrivate: (p) => isPrivateFile(p),
          }),
        }
      })
    )
    .pipe(
      nunjucksRender({
        path: templatesPath,
        inheritExtension: false,
        envOptions: {
          autoescape: false,
          trimBlocks: true,
          lstripBlocks: true,
          noCache: config.version === 'dev',
        },
        manageEnv: (env) => {
          const md = markdown({ html: true })
          env.addFilter('md', (str, inline = false) => {
            if (!str) return ''
            return inline ? md.renderInline(str) : md.render(str)
          })

          env.addFilter('mdInline', (str) => {
            if (!str) return ''
            return md.renderInline(str)
          })

          env.addFilter('date', formatTemplateDate)
        },
      })
    )
    .pipe(
      inject(globalAssets, {
        transform: (filepath) => {
          const cleanUrl = resolveInjectionUrl(filepath, config.paths.build)
          if (filepath.endsWith('.css')) {
            return `<link rel="stylesheet" href="${cleanUrl}">`
          }
          if (filepath.endsWith('.js')) {
            return `<script src="${cleanUrl}" type="module"></script>`
          }
          return filepath
        },
        addRootSlash: false,
        quiet: true,
      })
    )
    .pipe(
      new Transform({
        objectMode: true,
        transform(file, _enc, cb) {
          const content = file.contents.toString()
          file.contents = Buffer.from(
            cleanHtmlComments(stripXhtmlSlashes(content))
          )
          cb(null, file)
        },
      })
    )
    .pipe(ensureFileIntegrity({ taskName: 'Html', minSize: 50 }))

  if (config.formatCode) {
    htmlPipeline = htmlPipeline.pipe(beautify(config.htmlBeautify))
  }

  htmlPipeline = htmlPipeline
    .pipe(
      new Transform({
        objectMode: true,
        transform(file, _enc, cb) {
          if (file?.path) {
            processedFiles.push(getRelativePath(file.path))
          }
          cb(null, file)
        },
      })
    )
    .pipe(gulp.dest(config.paths.build))

  attachPipelineLogging({
    stream: htmlPipeline,
    loggerInstance: logger,
    trackedFiles: processedFiles,
    successLabel: 'HTML pages generated',
    emptyMessage: 'No HTML pages were generated.',
    errorMessage: 'HTML processing failed!',
  })

  try {
    await streamToPromise(htmlPipeline)
  } catch (error) {
    throw new Error('HTML generation failed.', { cause: error })
  }
}

export default processHtml
