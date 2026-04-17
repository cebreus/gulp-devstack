import fs from 'node:fs'
import path from 'node:path'

import { siteDefaults } from '../../src/config/site.js'

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
 * Processes a single JSON file for HTML rendering.
 * @param {import('vinyl')} file - Gulp file object
 * @param {object} params - Configuration parameters
 * @param {string} params.dataSource - Source data directory
 * @param {string} params.output - Output directory
 * @returns {import('vinyl')} Updated file object
 * @throws {Error} If file contents cannot be parsed as JSON or is not an object
 */
export function transformJsonToHtml(file, params) {
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
  file.data = {
    ...pageData,
    pageStyles: [
      ...(Array.isArray(pageData.pageStyles) ? pageData.pageStyles : []),
      ...discoverRouteStyles(routeRelDir, routeBaseName, params.output),
    ],
  }
  return file
}

/**
 * Discovers and returns URL paths for route-specific CSS assets.
 * @param {string} routeRelDir - Relative directory of the route
 * @param {string} routeBaseName - Base name of the route file
 * @param {string} outputBase - Build output directory
 * @returns {string[]} Discovered styles
 */
export function discoverRouteStyles(routeRelDir, routeBaseName, outputBase) {
  let pageAssetName = routeRelDir !== '.' ? routeRelDir : routeBaseName
  if (pageAssetName === 'index') pageAssetName = 'home'
  const candidates =
    routeRelDir !== '.'
      ? [
          `${routeRelDir}/${routeBaseName}.css`,
          `${pageAssetName}.css`,
          `${pageAssetName}/index.css`,
        ]
      : [`${routeBaseName}.css`, `${pageAssetName}/index.css`]

  const styles = []
  for (const name of candidates) {
    const fullPath = path.resolve(outputBase, 'assets/css', name)
    if (fs.existsSync(fullPath)) {
      const url = resolveInjectionUrl(fullPath, outputBase)
      if (!styles.includes(url)) styles.push(url)
    }
  }
  return styles
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
