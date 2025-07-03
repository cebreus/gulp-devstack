import fs from 'node:fs'
import path from 'node:path'
import { Transform } from 'node:stream'
import { glob } from 'glob'
import data from 'gulp-data'
import inject from 'gulp-inject'
import jsbeautifier from 'gulp-jsbeautifier'
import nunjucksRender from 'gulp-nunjucks-render'
import MarkdownIt from 'markdown-it'
import gulp from 'gulp'

import { siteDefaults } from '../../src/config/site.js'
import * as config from '../config.js'
import { streamToPromise } from '../utils/helpers.js'
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
  // First, protect script and style contents by temporarily replacing them or using a more precise regex.
  // The current project regex is: /<!--(?!\s*\[if|\s*<!|\s*\])(?![\s\S]*?(?:<script|<style)[\s\S]*?<!--)[\s\S]*?-->/g
  // It has issues with script tags. Let's use a simpler but safer approach for the task.
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
 * Resolves destination HTML path from a source file.
 * @param {string} inputPath - Absolute source path
 * @param {string} extFrom - Source extension
 * @param {string} extTo - Target extension
 * @param {string} baseDir - Base source directory
 * @param {string} outDir - Output directory
 * @returns {string} Resolved destination path
 */
export function calculateOutputPath(
  inputPath,
  extFrom,
  extTo,
  baseDir,
  outDir
) {
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
 * Resolves transform option key name for gulp-inject params.
 * @param {string} tag - Injection tag
 * @returns {string} Corresponding transform property key
 */
function resolveTransformKey(tag) {
  return `transform${tag.charAt(0).toUpperCase() + tag.slice(1).replace(':js', 'Js')}`
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

  return stream.pipe(
    inject(gulp.src(assets, { read: false }), {
      starttag: `<!-- inject:${tag} -->`,
      endtag: `<!-- endinject -->`,
      transform: params[resolveTransformKey(tag)] || defaultTransform,
      ignorePath: params.injectIgnorePath,
      relative: params.relative,
    })
  )
}

/**
 * Resolves source files used for HTML rendering.
 * @param {object} buildConfig - Active build configuration
 * @returns {Promise<{cssPayload: string[], jsPayload: string[], routesTemplateFiles: string[], optimizedDataSourceFiles: string[]}>} Collected source lists for HTML processing
 */
async function collectHtmlSources(buildConfig) {
  const assetsCssPath = buildConfig.sassBuild()
  const assetsJsPath = buildConfig.jsBuild()

  ;[assetsCssPath, assetsJsPath].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  })

  const cssPayload = (
    await glob(`${assetsCssPath}/**/*.css`.replace(/\\/g, '/'))
  ).filter((filePath) => {
    const fileName = path.basename(filePath)
    const cores = [
      'bootstrap.css',
      'custom.css',
      'utils.css',
      'components.css',
      'index.css',
    ]

    if (buildConfig.version() === 'dev') {
      cores.push('u-devstack.css')
    }

    return cores.some((core) => fileName.includes(core))
  })

  const jsPayload = (
    await glob(`${assetsJsPath}/**/*.js`.replace(/\\/g, '/'))
  ).filter(function (filePath) {
    return !filePath.includes('.min.js')
  })

  const rawDataSourceFiles = await glob(
    path.join(buildConfig.datasetPagesBuild, '**/*.json').replace(/\\/g, '/')
  )

  const routesTemplateFiles = (
    await glob(
      path.join(buildConfig.routesBase, '**/*.njk').replace(/\\/g, '/')
    )
  ).filter(function (filePath) {
    const fileName = path.basename(filePath)
    return (
      !fileName.startsWith('layout-') &&
      !fileName.startsWith('_') &&
      fileName !== 'menu.njk'
    )
  })

  const njkShadowPaths = routesTemplateFiles.map(function (filePath) {
    return path
      .relative(buildConfig.routesBase, filePath)
      .replace('.njk', '.json')
  })

  const optimizedDataSourceFiles = rawDataSourceFiles.filter(
    function (filePath) {
      const relativePath = path.relative(
        buildConfig.datasetPagesBuild,
        filePath
      )
      const baseName = path.basename(filePath)
      return (
        baseName !== 'menu.json' &&
        !baseName.startsWith('layout-') &&
        !njkShadowPaths.includes(relativePath)
      )
    }
  )

  return {
    cssPayload,
    jsPayload,
    routesTemplateFiles,
    optimizedDataSourceFiles,
  }
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

  const nunjucksSettings = {
    path: params.processPaths,
    envOptions: { autoescape: false, trimBlocks: true, lstripBlocks: true },
  }

  let htmlPipeline = gulp
    .src(params.input)
    .pipe(
      new Transform({
        objectMode: true,
        transform(file, _enc, cb) {
          const basename = path.basename(file.path)
          if (basename === 'menu.json' || basename.startsWith('layout-'))
            return cb()

          const extension = path.extname(file.path)
          let pageData = {}

          if (extension === '.json') {
            pageData = JSON.parse(file.contents.toString('utf8'))
            file.path = calculateOutputPath(
              file.path,
              '.json',
              '.html',
              params.dataSource,
              params.output
            )
            file.base = path.resolve(params.output)
            file.contents = Buffer.from(
              '{% extends "layout-default.njk" %}{% block content %}{{ page.content | md | safe }}{% endblock %}'
            )
          } else if (extension === '.njk') {
            const routesSourceBase = path.resolve(
              params.routesBase || params.processPaths?.[2] || './src/routes'
            )
            const absoluteFilePath = path.resolve(file.path)

            const relativeSourcePath = path.relative(
              routesSourceBase,
              absoluteFilePath
            )
            const relativeJsonPath = relativeSourcePath.replace('.njk', '.json')

            if (params.dataSource) {
              const fullJsonPath = path.join(
                path.resolve(params.dataSource),
                relativeJsonPath
              )
              pageData = loadJsonSafe(fullJsonPath)
            }

            file.path = calculateOutputPath(
              absoluteFilePath,
              '.njk',
              '.html',
              routesSourceBase,
              params.output
            )
            file.base = path.resolve(params.output)

            const routeRelDir = path.dirname(relativeSourcePath)
            const routeBaseName = path.basename(relativeSourcePath, '.njk')

            let pageAssetName =
              routeRelDir !== '.' ? routeRelDir : routeBaseName
            if (pageAssetName === 'index') pageAssetName = 'home'

            const pageStyles = []
            const pageScripts = []

            const assetCandidates = [
              `${routeRelDir !== '.' ? routeRelDir : ''}/${routeBaseName}.css`,
              `${pageAssetName}.css`,
              `${pageAssetName}/index.css`,
            ].filter(Boolean)

            assetCandidates.forEach((name) => {
              const fullPath = path.join(params.output, 'assets/css', name)
              if (fs.existsSync(fullPath)) {
                let normalizedPath = path.posix.normalize(`/assets/css/${name}`)
                if (!normalizedPath.startsWith('/'))
                  normalizedPath = `/${normalizedPath}`

                if (
                  normalizedPath !== '/assets/css/index.css' &&
                  !pageStyles.includes(normalizedPath)
                ) {
                  pageStyles.push(normalizedPath)
                }
              }
            })

            pageData.pageStyles = (pageData.pageStyles || []).concat(pageStyles)
            pageData.pageScripts = (pageData.pageScripts || []).concat(
              pageScripts
            )
          } else {
            return cb()
          }

          file.data = pageData
          cb(null, file)
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
              console.error('MD FILTER ERROR:', e)
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
            if (isNaN(dateObj.getTime())) return ''
            const lang =
              locale || this.ctx.page?.lang || siteContext.meta?.lang || 'en-US'

            const formatOptions =
              format && typeof format === 'object' ? format : {}
            return new Intl.DateTimeFormat(lang, formatOptions).format(dateObj)
          })
        },
      })
    )

  htmlPipeline = injectSet(htmlPipeline, params.injectCss, 'css', params)
  htmlPipeline = injectSet(htmlPipeline, params.injectJs, 'js', params)
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
   * Transforms CSS file path into a link tag.
   * @param {string} filepath - Path to the CSS file
   * @returns {string} HTML link tag
   */
  function transformCss(filepath) {
    return `<link rel="stylesheet" href="${resolveInjectionUrl(filepath, outputPath)}">`
  }

  /**
   * Transforms JS file path into a script tag.
   * @param {string} filepath - Path to the JS file
   * @returns {string} HTML script tag
   */
  function transformJs(filepath) {
    return `<script src="${resolveInjectionUrl(filepath, outputPath)}"></script>`
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
