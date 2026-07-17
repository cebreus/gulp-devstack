import path from 'node:path'
import { Transform } from 'node:stream'
import matter from 'gray-matter'
import nunjucks from 'nunjucks'
import gulp from 'gulp'

import { siteDefaults } from '../../src/config/site.js'
import loggerLib, {
  calculateReadingTime,
  getRelativePath,
  isPrivateFile,
} from '../utils/index.js'
import {
  buildPageData,
  buildRouteExpressionContext,
  extractMenuEntry,
  resolvePageLocation,
  writeMenuDataArtifact,
  writePageDataArtifact,
} from '../utils/route-data.js'

const logger = loggerLib.createLogger('ProcessData')

function renderExpression(value, context) {
  if (!value.includes('{{') && !value.includes('{%')) {
    return value
  }

  try {
    return nunjucks.renderString(value, context)
  } catch (error) {
    throw new Error(`[ProcessData] Failed to render expression: "${value}".`, {
      cause: error,
    })
  }
}

function resolveDataExpressions(data, context) {
  if (typeof data === 'string') {
    return renderExpression(data, context)
  }

  if (Array.isArray(data)) {
    return data.map((item) => resolveDataExpressions(item, context))
  }

  if (data instanceof Date) {
    return data
  }

  if (data !== null && typeof data === 'object') {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        resolveDataExpressions(value, context),
      ])
    )
  }

  return data
}

function assertUniquePageId(usedPageIds, jsonData, filePath) {
  const language = jsonData.language || 'en'
  const scopedPageId = `${language}:${jsonData.pageId}`

  if (usedPageIds.has(scopedPageId)) {
    throw new Error(
      `Duplicate pageId '${jsonData.pageId}' (language '${language}') in ${filePath}.`
    )
  }

  usedPageIds.add(scopedPageId)
}

function buildMenuEntry(frontmatter, fileName, pagePath, pageId) {
  const menuEntry = extractMenuEntry(frontmatter, fileName)
  if (!menuEntry.show) {
    return null
  }

  return {
    ...menuEntry,
    path: pagePath,
    url: pagePath,
    pageId,
  }
}

function createExpressionContext(frontmatter) {
  return buildRouteExpressionContext({
    frontmatter,
    siteConfig: siteDefaults,
  })
}

async function processContentFile(file, routesRoot, dest, usedPageIds) {
  const rawContent = file.contents.toString().trim()
  const fileName = path.basename(file.path, path.extname(file.path))

  if (!rawContent) {
    logger.warn(`Skipping empty data file: ${path.basename(file.path)}`)
    return null
  }

  const { data: frontmatter, content } = matter(rawContent)
  const { pagePath } = resolvePageLocation(file.path, fileName, routesRoot)
  const renderedFrontmatter = resolveDataExpressions(
    frontmatter,
    createExpressionContext(frontmatter)
  )

  const jsonData = buildPageData({
    frontmatter: renderedFrontmatter,
    content,
    fileName,
    pagePath,
    options: { homePageId: 'home' },
    siteConfig: siteDefaults,
  })

  jsonData.readingTime = calculateReadingTime(content)

  assertUniquePageId(usedPageIds, jsonData, file.path)

  return {
    jsonData,
    menuEntry: buildMenuEntry(
      renderedFrontmatter,
      fileName,
      pagePath,
      jsonData.pageId
    ),
    outputFilePath: await writePageDataArtifact({
      pageData: jsonData,
      filePath: file.path,
      artifactsBase: dest,
      routesBase: routesRoot,
    }),
  }
}

/**
 * Gulp Task: Processes Markdown/Frontmatter files into a unified JSON dataset.
 * Generates individual JSON files and a consolidated menu.json.
 * @param {string|string[]} src - Source glob pattern(s)
 * @param {string} dest - Destination directory for JSON output
 * @param {object} [options] - Additional build options
 * @param {string} [options.routesRoot] - Root directory for routes
 * @returns {import('node:stream').Stream} Gulp stream
 */
export default function processData(
  src,
  dest,
  { routesRoot = './src/routes' } = {}
) {
  logger.debug(
    `Processing dataset from ${src} to ${dest} (routesRoot: ${routesRoot})`
  )

  let processedCount = 0
  const globalMenuItems = []
  const generatedFiles = []
  const usedPageIds = new Set()

  const dataTransform = new Transform({
    objectMode: true,
    async transform(file, _enc, cb) {
      if (isPrivateFile(file.path)) {
        logger.verbose(`Skipping private content: ${path.basename(file.path)}`)
        return cb()
      }

      try {
        const result = await processContentFile(
          file,
          routesRoot,
          dest,
          usedPageIds
        )
        if (!result) {
          cb()
          return
        }

        const { jsonData, menuEntry, outputFilePath } = result
        if (menuEntry) {
          globalMenuItems.push(menuEntry)
        }
        processedCount += 1
        generatedFiles.push(getRelativePath(outputFilePath))
        file.contents = Buffer.from(JSON.stringify(jsonData))
        this.push(file)
        cb()
      } catch (error) {
        logger.error(`Failed to process ${file.path}. Cause: ${error.message}`)
        cb(error)
      }
    },
    async flush(cb) {
      try {
        const menuFile = await writeMenuDataArtifact(dest, globalMenuItems)
        generatedFiles.push(getRelativePath(menuFile))

        logger.info(`Dataset complete. ${processedCount} entries created.`)
        logger.list('Generated artifacts', generatedFiles)
        cb()
      } catch (error) {
        logger.error(`Failed to write menu.json. Cause: ${error.message}`)
        cb(error)
      }
    },
  })

  return gulp.src(src).pipe(dataTransform)
}
