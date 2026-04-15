import fs from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { Transform } from 'node:stream'
import { glob } from 'glob'
import data from 'gulp-data'
import inject from 'gulp-inject'
import jsbeautifier from 'gulp-jsbeautifier'
import newer from 'gulp-newer'
import nunjucksRender from 'gulp-nunjucks-render'
import MarkdownIt from 'markdown-it'
import gulp from 'gulp'

import { siteDefaults } from '../../src/config/site.js'
import * as config from '../config.js'
import { isPrivateFile, streamToPromise } from '../utils/helpers.js'
import loggerLib from '../utils/logger.js'

/**
 * @typedef {object} HtmlBuildParams
 * @property {string|string[]} input - Pattern(s) for input files
 * @property {string} output - Destination directory
 * @property {string[]} processPaths - Paths for Nunjucks resolution
 * @property {string} [dataSource] - Path to directory with JSON data
 * @property {string} [routesBase] - Base path for route resolution
 * @property {string[]} [injectCdnJs] - CDN scripts to inject
 * @property {string[]} [injectJs] - Local JS files to inject
 * @property {string[]} [injectCss] - Local CSS files to inject
 * @property {string} [injectIgnorePath] - Path part to ignore during injection
 * @property {boolean} [relative=false] - Use relative paths for injection
 * @property {function(string): string} [transformCss] - Custom CSS tag generator
 * @property {function(string): string} [transformJs] - Custom JS tag generator
 * @property {object} [siteDefaults] - Default site configuration
 */

const logger = loggerLib.createLogger('HTML')
const markdownParserCache = new Map()
const cssCache = new Map()

/**
 * Pre-loads CSS files into memory cache asynchronously.
 * Prevents blocking synchronous I/O during the render phase.
 * @param {string[]} cssPaths - List of absolute paths to CSS files
 */
async function preloadCssCache(cssPaths) {
  if (!cssPaths || cssPaths.length === 0) return

  await Promise.all(
    cssPaths.map(async (fullPath) => {
      if (cssCache.has(fullPath)) return

      try {
        const content = await readFile(fullPath, 'utf8')
        cssCache.set(fullPath, content)
      } catch (err) {
        logger.debug(`Could not preload CSS: ${fullPath} - ${err.message}`)
        cssCache.set(fullPath, null)
      }
    })
  )
}

/**
 * Strips XHTML-style self-closing slashes from HTML5 void elements only.
 * Preserves self-closing syntax in SVG/MathML elements (path, circle, rect, etc.).
 * @param {string} html - Input HTML string
 * @returns {string} Cleaned HTML string
 */
export function stripXhtmlSlashes(html) {
  const voidElements =
    'area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr'
  const voidPattern = new RegExp(`<(${voidElements})\\b([^>]*)/>`, 'gi')
  return html
    .replace(voidPattern, (_, tag, attrs) => `<${tag}${attrs.trimEnd()}>`)
    .replace(/<\/(?:meta|link|br|hr|img)>/gi, '')
}

/**
 * Clears HTML comments except IE conditionals and script/style content.
 * @param {string} html - Input HTML string
 * @returns {string} Cleaned HTML string
 */
export function cleanHtmlComments(html) {
  return html.replace(
    /<!--(?!\s*\[if|\s*<!|\s*\])[\s\S]*?-->/g,
    (match, offset, fullText) => {
      // Check if we are inside script or style tag
      const upToMatch = fullText.substring(0, offset)
      const isInsideProtected = /<(?:script|style)[^>]*>[^<]*$/i.test(upToMatch)
      return isInsideProtected ? match : ''
    }
  )
}

/**
 * Builds URL path used for injected CSS/JS tags.
 * @param {string} filepath - Asset file path
 * @param {string} buildOutputPath - Build output directory path
 * @returns {string} Public URL path
 */
export function resolveInjectionUrl(filepath, buildOutputPath) {
  const buildFolder = path.basename(buildOutputPath)
  const folderIndex = filepath.lastIndexOf(buildFolder)
  let urlPath =
    folderIndex !== -1
      ? filepath.slice(folderIndex + buildFolder.length)
      : filepath

  urlPath = urlPath.replace(/^[/\\]+/, '/')
  if (!urlPath.startsWith('/')) urlPath = `/${urlPath}`
  return urlPath.replace(/\\/g, '/')
}

/**
 * Factory function to get or create a MarkdownIt instance for a specific language.
 * @param {string} [lang] - Language code (cs, en, etc.)
 * @returns {MarkdownIt} Configured MarkdownIt instance
 */
function getMarkdownParser(lang = 'en') {
  const normalizedLang = lang.toLowerCase().split('-')[0]
  if (markdownParserCache.has(normalizedLang)) {
    return markdownParserCache.get(normalizedLang)
  }

  const quoteMap = {
    cs: '„“‚‘',
    cz: '„“‚‘',
    de: '„“‚‘',
    en: '“”‘’',
    fr: '«»‹›',
    sk: '„“‚‘',
  }

  const parser = new MarkdownIt({
    html: true,
    breaks: false,
    linkify: true,
    typographer: true,
    quotes: quoteMap[normalizedLang] || quoteMap.en,
  })

  markdownParserCache.set(normalizedLang, parser)
  return parser
}

/**
 * Loads menu data from the data source directory.
 * @param {string} dataSource - Directory containing menu.json
 * @returns {object} Parsed menu data or empty menu array
 */
function loadMenuData(dataSource) {
  if (!dataSource) return { menu: [] }
  const menuFilePath = path.join(dataSource, 'menu.json')
  try {
    if (fs.existsSync(menuFilePath)) {
      return JSON.parse(fs.readFileSync(menuFilePath, 'utf8'))
    }
  } catch (error) {
    logger.debug(`Could not load menu: ${error.message}`)
  }
  return { menu: [] }
}

/**
 * @typedef {object} OutputPathOptions
 * @property {string} inputPath - Absolute source path
 * @property {string} extFrom - Source extension
 * @property {string} extTo - Target extension
 * @property {string} baseDir - Base source directory
 * @property {string} outDir - Output directory
 */

/**
 * Resolves destination HTML path from a source file.
 * @param {OutputPathOptions} options - Path mapping options
 * @returns {string} Resolved destination path
 */
export function calculateOutputPath({
  inputPath,
  extFrom,
  extTo,
  baseDir,
  outDir,
}) {
  const relativePart = path.relative(baseDir, inputPath)
  return path.resolve(outDir, relativePart.replace(extFrom, extTo))
}

/**
 * Reads and parses JSON file content safely.
 * @param {string} filePath - JSON file path
 * @returns {object} Parsed object or empty object on failure
 */
function loadJsonSafe(filePath) {
  if (!fs.existsSync(filePath)) return {}
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch {
    return {}
  }
}

/**
 * Creates template context object for each rendered file.
 * @param {object} pageData - Per-page data
 * @param {HtmlBuildParams} params - HTML build parameters
 * @returns {{page: object, site: object}} Template context
 */
function createTemplateContext(pageData, params) {
  const currentSiteData = loadMenuData(params.dataSource) || {}
  return {
    page: pageData || {},
    site: {
      ...siteDefaults,
      ...currentSiteData,
      now: new Date().toISOString(),
    },
  }
}

/**
 * Maps injection tags to their corresponding transform parameter keys.
 */
const INJECT_TAG_TO_TRANSFORM_KEY = {
  css: 'transformCss',
  js: 'transformJs',
  'cdn-js': 'transformCdnJs',
}

/**
 * Resolves transform option key name for gulp-inject params.
 * @param {string} tag - Injection tag
 * @returns {string|null} Corresponding transform property key
 */
export function resolveTransformKey(tag) {
  return INJECT_TAG_TO_TRANSFORM_KEY[tag] || null
}

/**
 * Injects a single asset set into HTML stream.
 * @param {import('node:stream').Readable} stream - Target stream
 * @param {string[]} assets - Asset paths
 * @param {string} tag - Injection block tag
 * @param {HtmlBuildParams} params - Build params
 * @param {Function} [defaultTransform] - Optional fallback transform
 * @returns {import('node:stream').Readable} Updated stream
 */
function injectSet(stream, assets, tag, params, defaultTransform) {
  if (!assets || assets.length === 0) return stream

  const shouldRead = tag === 'css'

  return stream.pipe(
    inject(gulp.src(assets, { read: shouldRead }), {
      starttag: `<!-- inject:${tag} -->`,
      endtag: `<!-- endinject -->`,
      transform: params[resolveTransformKey(tag)] || defaultTransform,
      ignorePath: params.injectIgnorePath,
      relative: params.relative,
    })
  )
}

/**
 * Ensures build output directories exist.
 * @param {string[]} dirs - List of directories to create
 */
export function ensureBuildDirs(dirs) {
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  })
}

/** CSS core filenames injected into HTML per build mode. */
const CSS_CORES_BASE = [
  'bootstrap.css',
  'custom.css',
  'utils.css',
  'components.css',
  'index.css',
]
const CSS_CORES_DEV = [...CSS_CORES_BASE, 'u-devstack.css']

/**
 * Returns the list of core CSS filenames for a build mode.
 * @param {string} mode - Build version string
 * @returns {string[]} Core CSS filenames
 */
function getCssCoreNames(mode) {
  return mode === 'dev' ? CSS_CORES_DEV : CSS_CORES_BASE
}

/**
 * Checks if a CSS asset should be included in the HTML payload.
 * @param {string} filePath - Path to the CSS file
 * @param {string} mode - Active build mode
 * @returns {boolean} True if asset should be included
 */
function isCssAssetIncluded(filePath, mode) {
  const fileName = path.basename(filePath)
  const normalizedPath = filePath.replace(/\\/g, '/')

  if (mode === 'export' && normalizedPath.includes('/components/')) {
    return true
  }

  return getCssCoreNames(mode).some((core) => fileName.includes(core))
}

/**
 * Resolves CSS/JS asset lists for HTML injection.
 * @param {object} buildConfig - Active build configuration
 * @returns {Promise<{cssPayload: string[], jsPayload: string[]}>} Object containing arrays of CSS and JS file paths for injection
 */
async function resolveAssetPayloads(buildConfig) {
  const assetsCssPath = buildConfig.sassBuild()
  const assetsJsPath = buildConfig.jsBuild()

  const cssPayload = (
    await glob(`${assetsCssPath}/**/*.css`.replace(/\\/g, '/'))
  ).filter((filePath) => isCssAssetIncluded(filePath, buildConfig.version()))

  const jsPayload = (
    await glob(`${assetsJsPath}/**/*.js`.replace(/\\/g, '/'))
  ).filter((filePath) => !filePath.includes('.min.js'))

  return { cssPayload, jsPayload }
}

/**
 * Resolves template and dataset source file lists.
 * @param {object} buildConfig - Active build configuration
 * @returns {Promise<{routesTemplateFiles: string[], optimizedDataSourceFiles: string[]}>} Object containing arrays of template and datasource file paths
 */
async function resolveTemplateSources(buildConfig) {
  const routesTemplateFiles = (
    await glob(
      path.join(buildConfig.routesBase, '**/*.njk').replace(/\\/g, '/')
    )
  ).filter((filePath) => {
    const fileName = path.basename(filePath)
    return (
      !fileName.startsWith('layout-') &&
      !isPrivateFile(filePath) &&
      fileName !== 'menu.njk'
    )
  })

  const rawDataSourceFiles = await glob(
    path.join(buildConfig.datasetPagesBuild, '**/*.json').replace(/\\/g, '/')
  )

  const njkShadowPaths = routesTemplateFiles.map((filePath) =>
    path.relative(buildConfig.routesBase, filePath).replace('.njk', '.json')
  )

  const optimizedDataSourceFiles = rawDataSourceFiles.filter((filePath) => {
    const relativePath = path.relative(buildConfig.datasetPagesBuild, filePath)
    const baseName = path.basename(filePath)
    return (
      baseName !== 'menu.json' &&
      !baseName.startsWith('layout-') &&
      !isPrivateFile(filePath) &&
      !njkShadowPaths.includes(relativePath)
    )
  })

  return { routesTemplateFiles, optimizedDataSourceFiles }
}

/**
 * Resolves source files used for HTML rendering.
 * @param {object} buildConfig - Active build configuration
 * @returns {Promise<object>} Collected source lists for HTML processing
 */
async function collectHtmlSources(buildConfig) {
  ensureBuildDirs([buildConfig.sassBuild(), buildConfig.jsBuild()])

  const [assets, templates] = await Promise.all([
    resolveAssetPayloads(buildConfig),
    resolveTemplateSources(buildConfig),
  ])

  return { ...assets, ...templates }
}

/**
 * Processes a single JSON file for HTML rendering.
 * @param {object} file - Gulp file object
 * @param {HtmlBuildParams} params - Configuration parameters
 * @returns {object} Updated file object
 */
export function transformJsonToHtml(file, params) {
  const pageData = JSON.parse(file.contents.toString('utf8'))
  file.path = calculateOutputPath({
    inputPath: file.path,
    extFrom: '.json',
    extTo: '.html',
    baseDir: params.dataSource,
    outDir: params.output,
  })
  file.base = path.resolve(params.output)
  file.contents = Buffer.from(
    '{% extends "layout-default.njk" %}{% block content %}{{ page.content | md | safe }}{% endblock %}'
  )
  file.data = pageData
  return file
}

/**
 * Discovers and returns inline CSS assets for a given route using cache.
 * @param {string} routeRelDir - Relative directory of the route
 * @param {string} routeBaseName - Base name of the route file (without ext)
 * @param {string} outputBase - Build output directory
 * @returns {string[]} Array of CSS content strings from cache
 */
function discoverInlineStyles(routeRelDir, routeBaseName, outputBase) {
  let pageAssetName = routeRelDir !== '.' ? routeRelDir : routeBaseName
  if (pageAssetName === 'index') pageAssetName = 'home'

  const candidates = [
    `${routeRelDir !== '.' ? routeRelDir : ''}/${routeBaseName}.css`,
    `${pageAssetName}.css`,
    `${pageAssetName}/index.css`,
  ].filter(Boolean)

  const styles = []
  for (const name of candidates) {
    const fullPath = path.join(outputBase, 'assets/css', name)

    if (cssCache.has(fullPath)) {
      const cachedContent = cssCache.get(fullPath)
      if (cachedContent && !styles.includes(cachedContent)) {
        styles.push(cachedContent)
      }
    }
  }
  return styles
}

/**
 * Processes a single Nunjucks file for HTML rendering.
 * @param {object} file - Gulp file object
 * @param {HtmlBuildParams} params - Configuration parameters
 * @returns {object|null} Updated file object or null if skipped
 */
export function transformNjkToHtml(file, params) {
  const routesSourceBase = path.resolve(
    params.routesBase || params.processPaths?.[2] || './src/routes'
  )
  const absoluteFilePath = path.resolve(file.path)
  const relativeSourcePath = path.relative(routesSourceBase, absoluteFilePath)
  const relativeJsonPath = relativeSourcePath.replace('.njk', '.json')

  const pageData = params.dataSource
    ? loadJsonSafe(path.join(path.resolve(params.dataSource), relativeJsonPath))
    : {}

  file.path = calculateOutputPath({
    inputPath: absoluteFilePath,
    extFrom: '.njk',
    extTo: '.html',
    baseDir: routesSourceBase,
    outDir: params.output,
  })
  file.base = path.resolve(params.output)

  const routeRelDir = path.dirname(relativeSourcePath)
  const routeBaseName = path.basename(relativeSourcePath, '.njk')

  const pageInlineStyles = discoverInlineStyles(
    routeRelDir,
    routeBaseName,
    params.output
  )

  file.data = {
    ...pageData,
    pageInlineStyles: [
      ...(pageData.pageInlineStyles ?? []),
      ...pageInlineStyles,
    ],
    pageScripts: [...(pageData.pageScripts ?? [])],
  }

  return file
}

/**
 * Determines if any shared template (layout or component) has changed since the last build.
 * This is used to bypass incremental build and force a full re-render.
 * @param {string[]} sharedPaths - List of shared template directories
 * @param {string} outputPath - Build output directory
 * @returns {Promise<boolean>} True if a full rebuild is required
 */
async function checkSharedDependencies(sharedPaths, outputPath) {
  if (!fs.existsSync(outputPath)) return true

  const outputStat = fs.statSync(outputPath)
  const outputMtime = outputStat.mtimeMs

  for (const dir of sharedPaths) {
    if (!fs.existsSync(dir)) continue

    const files = await glob(path.join(dir, '**/*.*').replace(/\\/g, '/'))
    for (const file of files) {
      if (fs.statSync(file).mtimeMs > outputMtime) {
        logger.verbose(
          `Shared dependency changed: ${file}. Forcing full rebuild.`
        )
        return true
      }
    }
  }
  return false
}

/**
 * Core HTML processing engine using Nunjucks and Gulp.
 * @param {HtmlBuildParams} params - Configuration parameters
 * @returns {Promise<import('node:stream').Readable>} Gulp stream result
 */
export async function executeHtmlBuild(params) {
  const menuData = loadMenuData(params.dataSource)
  const siteContext = {
    ...params.siteDefaults,
    ...menuData,
    now: new Date().toISOString(),
  }

  // Preload CSS cache before starting the stream to avoid sync I/O in discoverInlineStyles
  if (params.injectCss) {
    await preloadCssCache(params.injectCss)
  }

  // Shared dependency check: if any layout or component changed, we force re-render everything
  const forceRebuild = await checkSharedDependencies(
    [params.processPaths[0], params.processPaths[1]], // Templates & Components
    params.output
  )

  const nunjucksSettings = {
    path: params.processPaths,
    envOptions: { autoescape: false, trimBlocks: true, lstripBlocks: true },
  }

  let htmlPipeline = gulp.src(params.input)

  // Incremental Build Logic
  if (!forceRebuild) {
    htmlPipeline = htmlPipeline.pipe(
      newer({
        dest: params.output,
        map: (relPath) => relPath.replace(/\.(njk|json|md)$/, '.html'),
      })
    )
  }

  htmlPipeline = htmlPipeline
    .pipe(
      new Transform({
        objectMode: true,
        transform(file, _enc, cb) {
          if (isPrivateFile(file.path)) return cb()

          const basename = path.basename(file.path)
          if (basename === 'menu.json' || basename.startsWith('layout-'))
            return cb()

          const extension = path.extname(file.path)
          let processedFile = null

          if (extension === '.json') {
            processedFile = transformJsonToHtml(file, params)
          } else if (extension === '.njk') {
            processedFile = transformNjkToHtml(file, params)
          }

          if (!processedFile) return cb()
          cb(null, processedFile)
        },
      })
    )
    .pipe(
      data((file) => {
        return createTemplateContext(file.data, params)
      })
    )
    .pipe(
      nunjucksRender({
        ...nunjucksSettings,
        manageEnv: (env) => {
          env.addFilter('md', function (str, langOverride) {
            if (!str) return ''
            const lang =
              langOverride ||
              this.ctx.page?.lang ||
              siteContext.meta?.lang ||
              'en'
            try {
              return getMarkdownParser(lang).render(str)
            } catch (e) {
              logger.error('MD FILTER ERROR:', e)
              return str
            }
          })

          env.addFilter('date', function (date, format, locale) {
            if (
              !date ||
              (typeof date === 'object' && Object.keys(date).length === 0)
            )
              return ''
            const dateObj = new Date(date)
            if (isNaN(dateObj.getTime())) {
              logger.warn(`Invalid date value provided to date filter: ${date}`)
              return date
            }
            const lang =
              locale || this.ctx.page?.lang || siteContext.meta?.lang || 'en-US'

            const formatOptions =
              format && typeof format === 'object' ? format : {}
            return new Intl.DateTimeFormat(lang, formatOptions).format(dateObj)
          })
        },
      })
    )

  const usedAssets = new Set()

  htmlPipeline = injectSet(
    htmlPipeline,
    params.injectCss,
    'css',
    params,
    (path, _file) => {
      const url = resolveInjectionUrl(path, params.output)
      if (usedAssets.has(url)) return ''
      usedAssets.add(url)
      return `<link rel="stylesheet" href="${url}">`
    }
  )
  htmlPipeline = injectSet(
    htmlPipeline,
    params.injectJs,
    'js',
    params,
    (path) => {
      const url = resolveInjectionUrl(path, params.output)
      if (usedAssets.has(url)) return ''
      usedAssets.add(url)
      return `<script src="${url}"></script>`
    }
  )
  htmlPipeline = injectSet(
    htmlPipeline,
    params.injectCdnJs,
    'cdn-js',
    params,
    (f) => `<script src="${f}"></script>`
  )

  const finishedStream = htmlPipeline
    .pipe(
      new Transform({
        objectMode: true,
        transform(file, _enc, cb) {
          if (file.isBuffer()) {
            let content = file.contents.toString()
            content = cleanHtmlComments(content)
            content = stripXhtmlSlashes(content)
            file.contents = Buffer.from(content)
          }
          cb(null, file)
        },
      })
    )
    .pipe(jsbeautifier(config.htmlBeautifyOptionsGetter()))
    .pipe(gulp.dest(params.output))

  await streamToPromise(finishedStream)
  return finishedStream
}

/**
 * Gulp Task: Builds all HTML pages from templates and datasets.
 * Automatically resolves dependencies like CSS/JS injection targets.
 * @param {object} buildConfig - The global Gulp configuration object
 * @returns {Promise<import('node:stream').Readable>} Final Gulp stream
 */
export async function processHtml(buildConfig) {
  const {
    cssPayload,
    jsPayload,
    routesTemplateFiles,
    optimizedDataSourceFiles,
  } = await collectHtmlSources(buildConfig)

  const outputPath = buildConfig.tplBuild()

  /**
   * Transforms CSS file path into a link tag or inline style string.
   * @param {string} filepath - Path to the CSS file
   * @param {object} file - Gulp file object
   * @returns {string} HTML source tag
   */
  function transformCss(filepath, file) {
    if (file && file.contents) {
      return `<style>${file.contents.toString('utf8')}</style>`
    }
    return `<link rel="stylesheet" href="${resolveInjectionUrl(filepath, outputPath)}">`
  }

  /**
   * Transforms JS file path into a script tag.
   * @param {string} filepath - Path to the JS file
   * @returns {string} HTML script tag
   */
  function transformJs(filepath) {
    return `<script type="module" src="${resolveInjectionUrl(filepath, outputPath)}"></script>`
  }

  return executeHtmlBuild({
    input: [...optimizedDataSourceFiles, ...routesTemplateFiles],
    output: outputPath,
    processPaths: [
      path.resolve(buildConfig.tplTemplatesBase),
      path.resolve(buildConfig.componentsPath),
      path.resolve(buildConfig.routesBase),
      path.resolve(config.iconsBase),
      path.resolve(config.imagesBase),
    ],
    dataSource: buildConfig.datasetPagesBuild,
    routesBase: buildConfig.routesBase,
    injectCdnJs: buildConfig.injectCdnJs(),
    injectJs: jsPayload,
    injectCss: cssPayload,
    injectIgnorePath: buildConfig.buildBase(),
    relative: false,
    transformCss,
    transformJs,
    siteDefaults,
  })
}

export default processHtml
