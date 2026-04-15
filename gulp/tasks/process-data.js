import { mkdirSync } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { Transform } from 'node:stream'
import matter from 'gray-matter'
import gulp from 'gulp'

import { siteDefaults } from '../../src/config/site.js'
import { isPrivateFile } from '../utils/helpers.js'
import loggerLib from '../utils/logger.js'

const logger = loggerLib.createLogger('Data')

/**
 * @typedef {object} PageMetadata
 * @property {string} title - Page title
 * @property {string} [page_id] - Unique page identifier
 * @property {string} [path] - Relative URL path
 * @property {object} [seo] - SEO specific metadata
 * @property {object} [open_graph] - OG social metadata
 * @property {object} [menu_main] - Main menu configuration
 */

/**
 * Recursively trims whitespace from all string values in an object or array.
 * @param {any} input - Target data structure
 * @returns {any} Trimmed data structure
 */
function deepTrimStrings(input) {
  if (typeof input === 'string') return input.trim()
  if (Array.isArray(input)) return input.map((item) => deepTrimStrings(item))
  if (input instanceof Date) return input
  if (input && typeof input === 'object') {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [key, deepTrimStrings(value)])
    )
  }
  return input
}

/**
 * Resolves route-relative folder and final page path for a content file.
 * @param {string} filePath - Absolute path to the source file
 * @param {string} fileName - Source file name without extension
 * @param {string} [routesRoot] - Routes root directory
 * @returns {{relativeDir: string, pagePath: string}} Route location metadata
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

  let pagePath = relativeDir !== '' ? `/${relativeDir}` : '/'
  if (fileName !== 'index') {
    pagePath = path.join(pagePath, fileName).replace(/\\/g, '/')
    if (!pagePath.startsWith('/')) pagePath = `/${pagePath}`
  }

  return { relativeDir, pagePath }
}

/**
 * Normalizes a URL to be absolute by prepending the base URL.
 * @param {string} url - Input URL
 * @param {string} baseUrl - Base URL to prepend
 * @returns {string} Normalized absolute URL
 */
function normalizeToAbsoluteUrl(url, baseUrl) {
  if (!url) return url
  if (/^https?:\/\//.test(url)) return url
  if (!baseUrl) return url
  return `${baseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`
}

/**
 * Resolves image metadata to absolute URLs recursively.
 * @param {any} data - Metadata object
 * @param {string} baseUrl - Project base URL
 * @returns {any} Processed metadata
 */
function resolveMetadataUrls(data, baseUrl) {
  const IMAGE_KEYS = ['image', 'images', 'thumbnail', 'url']

  if (typeof data === 'string') return normalizeToAbsoluteUrl(data, baseUrl)
  if (Array.isArray(data))
    return data.map((item) => resolveMetadataUrls(item, baseUrl))

  if (data && typeof data === 'object') {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => {
        if (
          IMAGE_KEYS.includes(key) &&
          (Array.isArray(value) || typeof value === 'string')
        ) {
          return [key, resolveMetadataUrls(value, baseUrl)]
        }
        if (value && typeof value === 'object') {
          return [key, resolveMetadataUrls(value, baseUrl)]
        }
        return [key, value]
      })
    )
  }
  return data
}

/**
 * Applies canonical and social metadata defaults to page data.
 * @param {object} jsonData - Existing normalized page data
 * @param {string} pagePath - Calculated page path
 * @param {object} [siteConfig] - Global site configuration
 * @returns {object} Page data enriched with SEO defaults
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
      canonical_self: pageCanonicalUrl,
      ...jsonData.seo,
    },
    open_graph: {
      url: pageCanonicalUrl,
      ...resolveMetadataUrls(jsonData.open_graph || {}, siteConfig.baseUrl),
    },
    twitter_cards: {
      url: pageCanonicalUrl,
      ...resolveMetadataUrls(jsonData.twitter_cards || {}, siteConfig.baseUrl),
    },
  }
}

/**
 * Builds normalized page payload from parsed markdown frontmatter and content.
 * @param {object} frontmatter - Parsed frontmatter fields
 * @param {string} content - Markdown content
 * @param {string} fileName - Source file name without extension
 * @param {string} pagePath - Calculated route path
 * @param {object} [options] - Task options
 * @param {string} [options.homePageId] - Optional custom page id for homepage
 * @param {object} [siteConfig] - Global site defaults
 * @returns {object} Normalized and SEO-enriched page data
 */
export function buildPageData(
  frontmatter,
  content,
  fileName,
  pagePath,
  options = {},
  siteConfig = siteDefaults
) {
  const autoPageId =
    pagePath === '/'
      ? options.homePageId || 'home'
      : path.basename(pagePath) || fileName

  const jsonData = {
    ...deepTrimStrings(frontmatter),
    content: deepTrimStrings(content),
    path: pagePath,
    fileName,
    page_id: frontmatter.page_id || autoPageId,
  }

  return applySeoDefaults(jsonData, pagePath, siteConfig)
}

/**
 * Extracts and normalizes menu data for a specific page.
 * @param {object} frontmatter - Parsed frontmatter data
 * @param {string} fileName - Current file name
 * @returns {object} Normalized menu entry
 */
function extractMenuEntry(frontmatter, fileName) {
  const DEFAULT_ORDER = 999

  if (frontmatter.menu_main && typeof frontmatter.menu_main === 'object') {
    return {
      name: frontmatter.menu_main.name || frontmatter.title || fileName,
      order: frontmatter.menu_main.order ?? DEFAULT_ORDER,
      show: frontmatter.menu_main.show !== false,
    }
  }

  return {
    name: frontmatter.menu_name || frontmatter.title || fileName,
    order: frontmatter.menu_order ?? DEFAULT_ORDER,
    show: frontmatter.show_in_menu !== false,
  }
}

/**
 * Gulp Task: Processes Markdown/Frontmatter files into a unified JSON dataset.
 * Generates individual JSON files and a consolidated menu.json.
 * @param {string|string[]} src - Source glob pattern(s)
 * @param {string} dest - Destination directory for JSON output
 * @param {object} [options] - Additional build options
 * @returns {import('node:stream').Readable} Gulp stream
 */
export function processData(src, dest, options = {}) {
  const routesRoot = options.routesRoot || './src/routes'
  logger.debug(
    `Processing dataset from ${src} to ${dest} (routesRoot: ${routesRoot})`
  )
  mkdirSync(dest, { recursive: true })

  let processedCount = 0
  const globalMenuItems = []
  const generatedFiles = []
  const usedPageIds = new Set()

  return gulp.src(src).pipe(
    new Transform({
      objectMode: true,
      async transform(file, _enc, cb) {
        try {
          if (isPrivateFile(file.path)) {
            logger.verbose(
              `Skipping private content file: ${path.basename(file.path)}`
            )
            return cb(null, null)
          }

          const rawContent = file.contents.toString().trim()
          const fileName = path.basename(file.path, path.extname(file.path))

          if (!rawContent) {
            logger.warn(`Skipping empty data file: ${path.basename(file.path)}`)
            return cb(null, null)
          }

          const { data: frontmatter, content } = matter(rawContent)

          const pageLocation = resolvePageLocation(
            file.path,
            fileName,
            routesRoot
          )

          let jsonData = buildPageData(
            frontmatter,
            content,
            fileName,
            pageLocation.pagePath,
            options,
            siteDefaults
          )

          if (usedPageIds.has(jsonData.page_id)) {
            logger.error(
              `Duplicate page_id '${jsonData.page_id}' found in ${path.basename(file.path)}. This will cause menu conflicts.`
            )
          }
          usedPageIds.add(jsonData.page_id)

          if (!jsonData.title) {
            jsonData.title =
              fileName.charAt(0).toUpperCase() + fileName.slice(1)
            logger.verbose(
              `Missing title in ${path.basename(file.path)}, using fallback: ${jsonData.title}`
            )
          }

          const outputDir = path.join(dest, pageLocation.relativeDir)
          mkdirSync(outputDir, { recursive: true })

          // Handle Menu
          const menuEntry = extractMenuEntry(jsonData, fileName)
          jsonData.menu_main = menuEntry

          if (menuEntry.show) {
            globalMenuItems.push({
              name: menuEntry.name,
              page_id: jsonData.page_id,
              url: pageLocation.pagePath,
              order: menuEntry.order,
            })
          }

          const outputFilePath = path.join(outputDir, `${fileName}.json`)
          await fs.writeFile(outputFilePath, JSON.stringify(jsonData, null, 2))
          generatedFiles.push(path.relative(process.cwd(), outputFilePath))
          processedCount++
          cb(null, file)
        } catch (error) {
          logger.error(`Failed to process data file ${file.path}:`, error)
          cb(error)
        }
      },
      async flush(cb) {
        try {
          globalMenuItems.sort((a, b) => a.order - b.order)
          const menuFile = path.join(dest, 'menu.json')
          await fs.writeFile(
            menuFile,
            JSON.stringify({ menu: globalMenuItems }, null, 2)
          )
          generatedFiles.push(path.relative(process.cwd(), menuFile))

          logger.info(
            `Dataset processing complete. ${processedCount} entries created.`
          )
          logger.list('Generated artifacts', generatedFiles)
          cb()
        } catch (error) {
          logger.error('Failed to write global menu.json:', error)
          cb(error)
        }
      },
    })
  )
}

export default processData
