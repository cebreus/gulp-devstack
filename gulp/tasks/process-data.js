import { mkdirSync } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { Transform } from 'node:stream'
import matter from 'gray-matter'
import nunjucks from 'nunjucks'
import gulp from 'gulp'

import { siteDefaults } from '../../src/config/site.js'
import loggerLib, {
  buildPageData,
  extractMenuEntry,
  isPrivateFile,
  resolvePageLocation,
} from '../utils/index.js'

const logger = loggerLib.createLogger('ProcessData')

/**
 * Internal: Renders a Nunjucks expression within a frontmatter string value.
 * Throws if the expression is syntactically invalid — caller must handle.
 * @param {string} value - The string to evaluate.
 * @param {Record<string, unknown>} context - Data context.
 * @returns {string} Processed string.
 * @private
 */
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

/**
 * Recursively resolves Nunjucks expressions within a data structure.
 * @param {unknown} data - The data to process (string, object, or array).
 * @param {Record<string, unknown>} context - The context for rendering.
 * @returns {unknown} Data with resolved expressions.
 */
export function resolveDataExpressions(data, context) {
  if (typeof data === 'string') {
    return renderExpression(data, context)
  }

  if (Array.isArray(data)) {
    return data.map((item) => resolveDataExpressions(item, context))
  }

  if (data !== null && typeof data === 'object') {
    const entries = Object.entries(data).map(([key, value]) => [
      key,
      resolveDataExpressions(value, context),
    ])
    return Object.fromEntries(entries)
  }

  return data
}

/**
 * Internal: Writes page JSON artifact to disk.
 * @param {object} params - Write parameters.
 * @param {string} params.dest - Destination base directory.
 * @param {string} params.routesRoot - Root of the source routes.
 * @param {string} params.filePath - Original file path.
 * @param {Record<string, unknown>} params.data - Data to write.
 * @returns {Promise<string>} Relative path to the generated file.
 * @private
 */
async function writeDataArtifact({ dest, routesRoot, filePath, data }) {
  const relativeFilePath = path.relative(routesRoot, filePath)
  const outputFileName = relativeFilePath.replace(
    path.extname(filePath),
    '.json'
  )
  const outputFilePath = path.join(dest, outputFileName)

  await fs.mkdir(path.dirname(outputFilePath), { recursive: true })
  await fs.writeFile(outputFilePath, JSON.stringify(data, null, 2))

  return path.relative(process.cwd(), outputFilePath)
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

  const dataTransform = new Transform({
    objectMode: true,
    async transform(file, _enc, cb) {
      if (isPrivateFile(file.path)) {
        logger.verbose(`Skipping private content: ${path.basename(file.path)}`)
        return cb()
      }

      const rawContent = file.contents.toString().trim()
      const fileName = path.basename(file.path, path.extname(file.path))

      if (!rawContent) {
        logger.warn(`Skipping empty data file: ${path.basename(file.path)}`)
        return cb()
      }

      try {
        const { data: frontmatter, content } = matter(rawContent)
        const { pagePath } = resolvePageLocation(
          file.path,
          fileName,
          routesRoot
        )

        // Resolve Nunjucks expressions within the frontmatter
        const context = { site: { ...siteDefaults }, page: { ...frontmatter } }
        const renderedFrontmatter = resolveDataExpressions(frontmatter, context)

        const jsonData = buildPageData({
          frontmatter: renderedFrontmatter,
          content,
          fileName,
          pagePath,
          options: { homePageId: 'home' },
          siteConfig: siteDefaults,
        })

        if (usedPageIds.has(jsonData.pageId)) {
          logger.warn(
            `Duplicate pageId '${jsonData.pageId}' in ${file.path}. This may cause routing conflicts.`
          )
        }
        usedPageIds.add(jsonData.pageId)

        // Menu processing
        const menuEntry = extractMenuEntry(frontmatter, fileName)
        if (menuEntry.show) {
          globalMenuItems.push({
            ...menuEntry,
            path: pagePath,
            url: pagePath,
            pageId: jsonData.pageId,
          })
        }

        const artifactPath = await writeDataArtifact({
          dest,
          routesRoot,
          filePath: file.path,
          data: jsonData,
        })

        processedCount += 1
        generatedFiles.push(artifactPath)

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
        globalMenuItems.sort((a, b) => a.order - b.order)
        const menuFile = path.join(dest, 'menu.json')
        await fs.writeFile(
          menuFile,
          JSON.stringify({ menu: globalMenuItems }, null, 2)
        )
        generatedFiles.push(path.relative(process.cwd(), menuFile))

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

/**
 * High-level orchestration for dataset generation based on build mode.
 * @param {object} config - Project configuration provider
 * @param {boolean} [fullBuild] - Whether to include site-wide metadata (true) or just pages (false)
 * @returns {import('gulp').TaskFunction | import('node:stream').Stream} Gulp parallel task result or stream
 */
export function processAllData(config, fullBuild = false) {
  const datasetPages = () =>
    processData(config.datasetPagesSource, config.datasetPagesBuild)

  if (fullBuild) {
    const datasetSite = () =>
      processData(config.siteConfigFile, config.tempBase)
    return gulp.parallel(datasetSite, datasetPages)
  }

  return datasetPages
}

export default processData
