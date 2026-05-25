import fs from 'node:fs'
import path from 'node:path'

import { siteDefaults } from '../../src/config/site.js'

const ROUTE_DATA_ARTIFACTS_DIRNAME = 'pages'
const SITE_DATA_ARTIFACT_FILENAME = 'site.json'
const MENU_DATA_ARTIFACT_FILENAME = 'menu.json'

/**
 * Builds URL path used for injected CSS/JS tags.
 * @param {string} filepath - Asset file path
 * @param {string} buildOutputPath - Build output directory path
 * @returns {string} Public URL path
 */
export function resolveInjectionUrl(filepath, buildOutputPath) {
  const buildRoot = path.resolve(buildOutputPath)
  const absoluteAssetPath = path.resolve(filepath)

  // Use path.relative to get the path from build root to the asset
  // This is the most robust way to calculate the public URL
  const relativeToBuild = path.relative(buildRoot, absoluteAssetPath)

  // Ensure leading slash and normalize slashes to forward ones
  const urlPath = `/${relativeToBuild.replace(/\\/g, '/')}`

  // Final cleanup of double slashes
  return urlPath.replace(/\/+/g, '/')
}

/**
 * Calculates output path for a file based on build configuration.
 * @param {object} root0 - Configuration object
 * @param {string} root0.inputPath - Source file path
 * @param {string} root0.extFrom - Original extension
 * @param {string} root0.extTo - Target extension
 * @param {string} root0.baseDir - Base input directory
 * @param {string} root0.outDir - Output directory
 * @returns {string} Calculated absolute output path
 */
export function calculateOutputPath({
  inputPath,
  extFrom,
  extTo,
  baseDir,
  outDir,
}) {
  const relativePath = path.relative(
    path.resolve(baseDir),
    path.resolve(inputPath)
  )
  return path.resolve(outDir, relativePath.replace(extFrom, extTo))
}

/**
 * Returns the directory that stores route data artifacts.
 * @param {string} tempBase - Temporary build directory
 * @returns {string} Route data artifacts directory
 */
export function getRouteDataArtifactsDir(tempBase) {
  return path.join(tempBase, ROUTE_DATA_ARTIFACTS_DIRNAME)
}

/**
 * Returns the path to the site metadata artifact.
 * @param {string} tempBase - Temporary build directory
 * @returns {string} Site data artifact path
 */
export function getSiteDataArtifactPath(tempBase) {
  return path.join(tempBase, SITE_DATA_ARTIFACT_FILENAME)
}

/**
 * Returns the path to the route menu artifact.
 * @param {string} artifactsBase - Route data artifacts directory
 * @returns {string} Menu artifact path
 */
export function getMenuDataArtifactPath(artifactsBase) {
  return path.join(artifactsBase, MENU_DATA_ARTIFACT_FILENAME)
}

/**
 * Returns the path to a route page data artifact.
 * @param {object} root0 - Artifact parameters
 * @param {string} root0.artifactsBase - Route data artifacts directory
 * @param {string} root0.routesBase - Routes source directory
 * @param {string} root0.filePath - Route file path
 * @returns {string} Page data artifact path
 */
export function getPageDataArtifactPath({
  artifactsBase,
  routesBase,
  filePath,
}) {
  const relativeFilePath = path.relative(routesBase, filePath)
  const outputFileName = relativeFilePath.replace(
    path.extname(filePath),
    '.json'
  )
  return path.join(artifactsBase, outputFileName)
}

/**
 * Resolves route-relative folder and final page path for a content file.
 * @param {string} filePath - Absolute path to the source file
 * @param {string} fileName - Source file name without extension
 * @param {string} [routesRoot] - Routes root directory
 * @returns {{ relativeDir: string, pagePath: string }} Route location metadata
 */
export function resolvePageLocation(
  filePath,
  fileName,
  routesRoot = './src/routes'
) {
  const absoluteRoutesRoot = path.resolve(routesRoot)
  const absoluteFilePath = path.resolve(filePath)
  const isRouteFile = absoluteFilePath.startsWith(absoluteRoutesRoot)
  const relativeDir = isRouteFile
    ? path
        .relative(absoluteRoutesRoot, path.dirname(absoluteFilePath))
        .replace(/\\/g, '/')
    : ''

  let pagePath = relativeDir !== '' ? `/${relativeDir}/` : '/'
  if (fileName !== 'index') {
    pagePath = path.join(pagePath, fileName).replace(/\\/g, '/')
    if (!pagePath.startsWith('/')) pagePath = `/${pagePath}`
  }
  return { relativeDir, pagePath }
}

/**
 * Strips XHTML-style self-closing slashes from HTML5 void elements only.
 * @param {string} html - Input HTML string
 * @returns {string} Cleaned HTML string
 */
export function stripXhtmlSlashes(html) {
  const voids =
    'area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr'
  const pattern = new RegExp(`<(${voids})\\b([^>]*)/>`, 'gi')
  return html
    .replace(pattern, (_, tag, attrs) => `<${tag}${attrs.trimEnd()}>`)
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
      const isInsideProtected = /<(?:script|style)[^>]*>[^<]*$/i.test(
        fullText.substring(0, offset)
      )
      return isInsideProtected ? match : ''
    }
  )
}

/**
 * Recursively trims whitespace from all string values in an object or array.
 * @param {unknown} input - Target data structure
 * @returns {unknown} Trimmed data structure
 */
export function deepTrimStrings(input) {
  if (typeof input === 'string') return input.trim()
  if (Array.isArray(input)) return input.map(deepTrimStrings)
  if (input instanceof Date) return input
  if (input && typeof input === 'object') {
    return Object.fromEntries(
      Object.entries(input).map(([k, v]) => [k, deepTrimStrings(v)])
    )
  }
  return input
}

/**
 * Normalizes a URL to be absolute by prepending the base URL.
 * @param {string} url - Input URL
 * @param {string} baseUrl - Base URL to prepend
 * @returns {string} Normalized absolute URL
 */
function normalizeToAbsoluteUrl(url, baseUrl) {
  if (!url || /^https?:\/\//.test(url) || !baseUrl) return url
  return `${baseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`
}

/**
 * Builds the context used to resolve frontmatter expressions.
 * @param {object} root0 - Context parameters
 * @param {Record<string, unknown>} [root0.frontmatter] - Page frontmatter
 * @param {Record<string, unknown>} [root0.siteConfig] - Site metadata
 * @returns {{ site: Record<string, unknown>, page: Record<string, unknown> }} Expression context
 */
export function buildRouteExpressionContext({
  frontmatter = {},
  siteConfig = siteDefaults,
}) {
  return {
    site: { ...siteConfig },
    page: { ...frontmatter },
  }
}

/**
 * Resolves image metadata to absolute URLs recursively.
 * @param {unknown} data - Metadata object or array
 * @param {string} baseUrl - Project base URL
 * @returns {unknown} Processed metadata
 */
export function resolveMetadataUrls(data, baseUrl) {
  const IMAGE_KEYS = new Set(['image', 'images', 'thumbnail', 'url'])
  if (typeof data === 'string') return normalizeToAbsoluteUrl(data, baseUrl)
  if (Array.isArray(data))
    return data.map((item) => resolveMetadataUrls(item, baseUrl))
  if (data && typeof data === 'object') {
    return Object.fromEntries(
      Object.entries(data).map(([k, v]) => [
        k,
        IMAGE_KEYS.has(k) || (v && typeof v === 'object')
          ? resolveMetadataUrls(v, baseUrl)
          : v,
      ])
    )
  }
  return data
}

/**
 * Applies canonical and social metadata defaults to page data.
 * @param {Record<string, unknown>} jsonData - Existing normalized page data
 * @param {string} pagePath - Calculated page path
 * @param {object} [siteConfig] - Site configuration
 * @param {string} siteConfig.baseUrl - Base URL
 * @returns {Record<string, unknown>} Enriched page data
 */
export function applySeoDefaults(
  jsonData,
  pagePath,
  siteConfig = siteDefaults
) {
  const baseNoSlash = (siteConfig.baseUrl || '').replace(/\/$/, '')
  const pageCanonicalUrl = `${baseNoSlash}${pagePath}`
  return {
    ...jsonData,
    seo: {
      canonicalSelf: pageCanonicalUrl,
      ...(typeof jsonData.seo === 'object' ? jsonData.seo : {}),
    },
    openGraph: {
      url: pageCanonicalUrl,
      ...resolveMetadataUrls(
        (typeof jsonData.openGraph === 'object' ? jsonData.openGraph : {}) ||
          {},
        siteConfig.baseUrl
      ),
    },
    twitterCards: {
      url: pageCanonicalUrl,
      ...resolveMetadataUrls(
        (typeof jsonData.twitterCards === 'object'
          ? jsonData.twitterCards
          : {}) || {},
        siteConfig.baseUrl
      ),
    },
  }
}

/**
 * Builds the global route context shared by all pages.
 * @param {object} root0 - Global context parts
 * @param {Record<string, unknown>} [root0.siteData] - Site artifact payload
 * @param {Record<string, unknown>} [root0.menuData] - Menu artifact payload
 * @returns {Record<string, unknown>} Global route context
 */
export function buildGlobalContext({ siteData = {}, menuData = {} } = {}) {
  return {
    ...siteData,
    ...menuData,
  }
}

/**
 * Builds the menu artifact payload from route menu entries.
 * @param {object[]} menuEntries - Raw menu entries
 * @returns {{ menu: object[] }} Menu artifact payload
 */
export function buildMenuData(menuEntries) {
  return {
    menu: [...menuEntries].sort((a, b) => a.order - b.order),
  }
}

/**
 * Builds normalized page payload from parsed markdown frontmatter and content.
 * @param {object} root0 - Processing parameters.
 * @param {Record<string, unknown>} root0.frontmatter - Parsed frontmatter fields.
 * @param {string} root0.content - Markdown content.
 * @param {string} root0.fileName - Source file name without extension.
 * @param {string} root0.pagePath - Calculated route path.
 * @param {object} [root0.options] - Custom options.
 * @param {object} [root0.siteConfig] - Site configuration.
 * @returns {Record<string, unknown>} Final page data.
 */
export function buildPageData({
  frontmatter,
  content,
  fileName,
  pagePath,
  options = {},
  siteConfig = siteDefaults,
}) {
  if (!frontmatter || typeof frontmatter !== 'object') {
    throw new Error('Frontmatter must be a valid object.', {
      cause: new Error(`Received type: ${typeof frontmatter}`),
    })
  }
  const autoPageId =
    pagePath === '/'
      ? options.homePageId || 'home'
      : path.basename(pagePath) || fileName
  const jsonData = {
    ...deepTrimStrings(frontmatter),
    content: deepTrimStrings(content),
    path: pagePath,
    fileName,
    pageId: frontmatter.pageId || autoPageId,
  }
  return applySeoDefaults(jsonData, pagePath, siteConfig)
}

/**
 * Builds the final Nunjucks context for a route template.
 * @param {object} root0 - Template context parts
 * @param {Record<string, unknown>} [root0.pageData] - Page data artifact
 * @param {Record<string, unknown>} [root0.globalContext] - Shared site and menu context
 * @param {object} root0.config - Build configuration
 * @param {string[]} [root0.pageStyles] - Route styles to inject
 * @param {string[]} [root0.pageScripts] - Route scripts to inject
 * @param {(filePath: string) => boolean} [root0.isPrivate] - Private path predicate
 * @returns {Record<string, unknown>} Final template context
 */
export function buildTemplateContext({
  pageData = {},
  globalContext = {},
  config,
  pageStyles = [],
  pageScripts = [],
  isPrivate,
}) {
  const context = {
    ...pageData,
    page: pageData,
    site: globalContext,
    config,
    pageStyles,
    pageScripts,
  }

  if (typeof isPrivate === 'function') {
    context.isPrivate = isPrivate
  }

  return context
}

/**
 * Processes a single JSON file for HTML rendering.
 * @param {import('vinyl')} file - Gulp file object
 * @param {object} params - Configuration parameters
 * @param {string} params.dataSource - Source data directory
 * @param {string} params.output - Output directory
 * @returns {Promise<import('vinyl')>} Updated file object
 * @throws {Error} If file contents cannot be parsed as JSON or is not an object
 */
export async function transformJsonToHtml(file, params) {
  let pageData
  try {
    pageData = JSON.parse(file.contents.toString('utf8'))
  } catch (error) {
    throw new Error(`Failed to parse JSON from file: ${file.path}`, {
      cause: error,
    })
  }
  if (!pageData || typeof pageData !== 'object' || Array.isArray(pageData)) {
    throw new Error(`Parsed JSON must be an object in file: ${file.path}`, {
      cause: new Error(
        `Received type: ${Array.isArray(pageData) ? 'array' : typeof pageData}`
      ),
    })
  }

  file.path = calculateOutputPath({
    inputPath: file.path,
    extFrom: '.json',
    extTo: '.html',
    baseDir: params.dataSource,
    outDir: params.output,
  })
  file.base = path.resolve(params.output)
  const routeRelDir = path.dirname(path.relative(file.base, file.path))
  const routeBaseName = path.basename(file.path, '.html')
  file.contents = Buffer.from(
    '{% extends "layout-default.njk" %}{% block content %}{{ page.content | md | safe }}{% endblock %}'
  )

  const discoveredStyles = await discoverRouteStyles(
    routeRelDir,
    routeBaseName,
    params.output
  )

  file.data = {
    ...pageData,
    pageStyles: [
      ...(Array.isArray(pageData.pageStyles) ? pageData.pageStyles : []),
      ...discoveredStyles,
    ],
  }
  return file
}

/**
 * Internal cache for discovered assets to avoid redundant FS lookups.
 * @type {Map<string, Set<string>>}
 * @private
 */
const ASSET_MANIFEST_CACHE = new Map()

/**
 * Discovers and returns URL paths for route-specific assets (CSS or JS).
 * Uses an asynchronous manifest-based approach to avoid event loop blockage.
 * @param {string} routeRelDir - Relative directory of the route
 * @param {string} routeBaseName - Base name of the route file
 * @param {string} outputBase - Build output directory
 * @param {object} [options] - Discovery options
 * @param {string} [options.subDir] - Asset subdirectory (e.g., 'css', 'js')
 * @param {string[]} [options.extensions] - Allowed extensions (e.g., ['.css', '.min.css'])
 * @returns {Promise<string[]>} Discovered asset URLs
 */
export async function discoverRouteAssets(
  routeRelDir,
  routeBaseName,
  outputBase,
  { subDir = 'css', extensions = ['.css'] } = {}
) {
  const assetDir = path.resolve(outputBase, 'assets', subDir)

  // Initialize or retrieve cache for this build run
  if (!ASSET_MANIFEST_CACHE.has(assetDir)) {
    try {
      const entries = await fs.promises.readdir(assetDir, { recursive: true })
      ASSET_MANIFEST_CACHE.set(
        assetDir,
        new Set(entries.map((e) => e.replace(/\\/g, '/')))
      )
    } catch {
      // If directory doesn't exist yet, we can't find anything
      return []
    }
  }

  const manifest = ASSET_MANIFEST_CACHE.get(assetDir)
  let pageAssetName = routeRelDir !== '.' ? routeRelDir : routeBaseName
  if (pageAssetName === 'index') pageAssetName = 'home'

  const candidates =
    routeRelDir !== '.'
      ? [
          ...extensions.map((ext) => `${routeRelDir}/${routeBaseName}${ext}`),
          ...extensions.map((ext) => `${pageAssetName}${ext}`),
          ...extensions.map((ext) => `${pageAssetName}/index${ext}`),
        ]
      : [
          ...extensions.map((ext) => `${routeBaseName}${ext}`),
          ...extensions.map((ext) => `${pageAssetName}/index${ext}`),
        ]

  const discovered = []
  for (const name of candidates) {
    const normalizedName = name.replace(/\\/g, '/')
    if (manifest.has(normalizedName)) {
      const fullPath = path.resolve(assetDir, normalizedName)
      const url = resolveInjectionUrl(fullPath, outputBase)
      if (!discovered.includes(url)) discovered.push(url)
    }
  }
  return discovered
}

/**
 * Discovers and returns URL paths for route-specific CSS assets (Legacy Alias).
 * @param {string} routeRelDir - Relative directory of the route
 * @param {string} routeBaseName - Base name of the route file
 * @param {string} outputBase - Build output directory
 * @returns {Promise<string[]>} Discovered styles
 */
export async function discoverRouteStyles(
  routeRelDir,
  routeBaseName,
  outputBase
) {
  return discoverRouteAssets(routeRelDir, routeBaseName, outputBase, {
    subDir: 'css',
    extensions: ['.css', '.min.css'],
  })
}

/**
 * Discovers and returns URL paths for route-specific JS assets.
 * @param {string} routeRelDir - Relative directory of the route
 * @param {string} routeBaseName - Base name of the route file
 * @param {string} outputBase - Build output directory
 * @returns {Promise<string[]>} Discovered scripts
 */
export async function discoverRouteScripts(
  routeRelDir,
  routeBaseName,
  outputBase
) {
  return discoverRouteAssets(routeRelDir, routeBaseName, outputBase, {
    subDir: 'js',
    extensions: ['.js'],
  })
}

/**
 * Resolves the configuration key for a given injection tag.
 * @param {string} tag - Injection tag name
 * @returns {string|null} Mapping key
 */
export function resolveTransformKey(tag) {
  const mappings = {
    css: 'transformCss',
    js: 'transformJs',
    'cdn-js': 'transformCdnJs',
  }
  return mappings[tag] ?? null
}

/**
 * Extracts and normalizes menu data for a specific page.
 * @param {Record<string, unknown>} frontmatter - Parsed frontmatter data
 * @param {string} fileName - Current file name
 * @returns {{ name: string, order: number, show: boolean }} Menu entry
 */
export function extractMenuEntry(frontmatter, fileName) {
  const DEFAULT_ORDER = 999
  const m = frontmatter.menuMain

  if (m && typeof m === 'object') {
    return {
      name: m.name || frontmatter.title || fileName,
      order: m.order ?? DEFAULT_ORDER,
      show: m.show !== false,
    }
  }

  return {
    name: frontmatter.menuName || frontmatter.title || fileName,
    order: frontmatter.menuOrder ?? DEFAULT_ORDER,
    show: frontmatter.showInMenu !== false,
  }
}
