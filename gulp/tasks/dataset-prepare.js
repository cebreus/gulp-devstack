import gulp from 'gulp'

import { siteDefaults } from '../../src/config/site.js'
import { mkdirr } from '../utils/helpers.js'
import logger from '../utils/logger.js'
import matter from 'gray-matter'
import fs from 'node:fs/promises'
import path from 'node:path'
import { Transform } from 'node:stream'
import pc from 'picocolors'

/**
 * Loads the site configuration object.
 * @returns {object} Site configuration object
 */
function loadSiteConfig() {
  return siteDefaults
}

/**
 * Recursively trims all string values in an object or array.
 * @param {any} obj - The object to trim
 * @returns {any} The trimmed object
 */
function deepTrim(obj) {
  if (typeof obj === 'string') return obj.trim()
  if (Array.isArray(obj)) return obj.map(deepTrim)
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, deepTrim(v)])
    )
  }
  return obj
}

/**
 * Converts relative URLs to absolute URLs
 * @param {string} url - URL to convert
 * @param {string} baseUrl - Base URL to prepend
 * @returns {string} - Absolute URL
 */
function makeAbsoluteUrl(url, baseUrl) {
  if (!url) return url
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('/')) return baseUrl + url
  return baseUrl + '/' + url
}

/**
 * Recursively converts relative image URLs to absolute URLs in an object
 * @param {any} obj - Object to process
 * @param {string} baseUrl - Base URL to prepend
 * @param {string[]} [imageKeys] - Keys to treat as image URLs (default: ['image','images','thumbnail'])
 * @returns {any} - Object with converted URLs
 */
function convertImagesToAbsolute(
  obj,
  baseUrl,
  imageKeys = ['image', 'images', 'thumbnail']
) {
  if (typeof obj === 'string') return makeAbsoluteUrl(obj, baseUrl)
  if (Array.isArray(obj))
    return obj.map((item) => convertImagesToAbsolute(item, baseUrl, imageKeys))
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => {
        if (
          imageKeys.includes(k) &&
          (Array.isArray(v) || typeof v === 'string')
        ) {
          return [k, convertImagesToAbsolute(v, baseUrl, imageKeys)]
        }
        if (typeof v === 'object' && v !== null) {
          return [k, convertImagesToAbsolute(v, baseUrl, imageKeys)]
        }
        return [k, v]
      })
    )
  }
  return obj
}

/**
 * Gulp task: Prepares dataset from Markdown files, outputs JSON for each page and a menu.json.
 * @param {string|string[]} src - Source path(s)
 * @param {string} dest - Destination directory
 * @param {object} options - Options
 * @returns {any} A Gulp stream.
 */
export default function datasetPrepare(src, dest, options = {}) {
  logger.debug(`[Dataset] Preparing from ${src}`)
  logger.debug(`[Dataset] Output directory: ${dest}`)

  mkdirr(dest, logger)

  let filesCount = 0
  const menuItems = []

  return gulp.src(src).pipe(
    new Transform({
      objectMode: true,
      async transform(file, _enc, callback) {
        try {
          const filePath = file.path
          const fileContent = file.contents.toString()
          const fileName = path.basename(filePath, path.extname(filePath))
          const relFilePath = path.relative(process.cwd(), filePath)
          logger.debug(
            `[Dataset] Processing Markdown file: ${pc.yellow(relFilePath)}`
          )

          // Extract front matter from the Markdown file.
          const parsed = matter(fileContent)
          const trimmedData = deepTrim(parsed.data)
          const trimmedContent = deepTrim(parsed.content)

          // Create the output directory.
          const relativePath = path.relative(
            './src/routes',
            path.dirname(filePath)
          )
          const outputDir = path.join(dest, relativePath)
          mkdirr(outputDir, logger)

          // Create the JSON data structure.
          const homePageId = options.homePageId || 'home'
          const pageId =
            relativePath === ''
              ? homePageId
              : path.basename(relativePath) || fileName
          const jsonData = {
            ...trimmedData,
            content: trimmedContent,
            path: relativePath === '' ? '/' : '/' + relativePath,
            fileName,
            page_id: pageId,
          }

          // Add SEO and social media metadata.
          const siteConfig = loadSiteConfig()
          const pageUrl = relativePath === '' ? '/' : '/' + relativePath + '/'
          if (!jsonData.seo) jsonData.seo = {}
          jsonData.seo.canonical_self = siteConfig.baseUrl + pageUrl
          if (!jsonData.open_graph) jsonData.open_graph = {}
          if (!jsonData.open_graph.url)
            jsonData.open_graph.url = siteConfig.baseUrl + pageUrl
          if (!jsonData.twitter_cards) jsonData.twitter_cards = {}
          if (!jsonData.twitter_cards.url)
            jsonData.twitter_cards.url = siteConfig.baseUrl + pageUrl

          logger.debug(
            `          '${pageId}/' canonical_self: ${jsonData.seo.canonical_self}`
          )
          logger.debug(
            `          '${pageId}/' open_graph.url: ${jsonData.open_graph.url}`
          )
          logger.debug(
            `          '${pageId}/' twitter_cards.url: ${jsonData.twitter_cards.url}`
          )

          // Add menu-related properties to the JSON data.
          let menuConfig
          if (
            trimmedData.menu_main &&
            typeof trimmedData.menu_main === 'object'
          ) {
            menuConfig = {
              name: trimmedData.menu_main.name || trimmedData.title || fileName,
              order: trimmedData.menu_main.order || 999,
              show: trimmedData.menu_main.show !== false,
            }
          } else {
            menuConfig = {
              name: trimmedData.menu_name || trimmedData.title || fileName,
              order: trimmedData.menu_order || 999,
              show: trimmedData.show_in_menu !== false,
            }
          }
          jsonData.menu_main = menuConfig

          // Convert relative image URLs to absolute URLs.
          if (jsonData.open_graph) {
            jsonData.open_graph = convertImagesToAbsolute(
              jsonData.open_graph,
              siteConfig.baseUrl
            )
          }
          if (jsonData.twitter_cards) {
            jsonData.twitter_cards = convertImagesToAbsolute(
              jsonData.twitter_cards,
              siteConfig.baseUrl
            )
          }

          // Add the page to the menu if it's set to be shown.
          if (menuConfig.show) {
            const url = relativePath === '' ? '/' : '/' + relativePath
            menuItems.push({
              name: menuConfig.name,
              page_id: pageId,
              url,
              order: menuConfig.order,
            })
          }

          logger.debug(
            `          '${pageId}/' Extracted data: ${pc.dim(JSON.stringify(jsonData).slice(0, 100))}`
          )

          // Write the JSON data to a file, await to limit concurrency and avoid resource exhaustion.
          const outputFile = path.join(outputDir, `${fileName}.json`)
          try {
            await fs.writeFile(outputFile, JSON.stringify(jsonData, null, 2))
            filesCount++
            callback(null, file)
          } catch (err) {
            logger.error(
              `[Dataset] Error writing JSON file ${outputFile}:`,
              err
            )
            callback(err, file)
          }
        } catch (error) {
          logger.error(
            `[Dataset] Error processing Markdown file ${file.path}:`,
            error
          )
          callback(error, file)
        }
      },
      async flush(callback) {
        try {
          // Create the menu.json file after all files are processed.
          menuItems.sort((a, b) => a.order - b.order)
          const menuData = { menu: menuItems }
          const menuFile = path.join(dest, 'menu.json')
          await fs.writeFile(menuFile, JSON.stringify(menuData, null, 2))
          logger.debug(
            `[Dataset] Menu data written to: ${pc.yellow(path.relative(process.cwd(), menuFile))}`
          )
          logger.debug(
            `[Dataset] Menu items: ${pc.dim(JSON.stringify(menuItems).slice(0, 100))}`
          )
          logger.debug(
            `[Dataset] Preparation complete: ${filesCount} files processed`
          )
          callback()
        } catch (error) {
          logger.error(`[Dataset] Error writing menu.json:`, error)
          callback(error)
        }
      },
    })
  )
}
