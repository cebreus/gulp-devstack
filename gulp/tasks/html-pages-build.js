import { siteDefaults } from '../../src/config/site.js'
import logger from '../utils/logger.js'
import htmlBuildFnc from './html-build.js'
import { glob } from 'glob'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Build HTML pages from templates
 * @param {object} config - Configuration object
 * @returns {Promise<void>}
 */
export default async function buildHtmlPages(config) {
  const isDev = config.version() === 'dev'
  const cssPath = config.sassBuild()
  const jsPath = config.jsBuild()

  // Create build paths if they don't exist.
  ;[cssPath, jsPath].forEach((dir) => {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {
          recursive: true,
        })
      }
    } catch (error) {
      logger.error(`Error creating directory ${dir}:`, error)
    }
  })

  // Define paths to search for Nunjucks templates.
  const templatePaths = [
    path.resolve(config.tplTemplatesBase),
    path.resolve(config.componentsPath),
    path.resolve(config.routesBase),
  ]

  // Determine CSS files for injection based on the build environment.
  let cssFiles
  if (isDev) {
    cssFiles = glob
      .sync(`${cssPath}/**/*.css`)
      .filter((file) => !file.includes('.min.css'))
  } else {
    cssFiles = glob.sync(`${cssPath}/**/*.min.css`)
  }

  // Determine JS files for injection based on the build environment.
  const jsFiles = glob
    .sync(`${jsPath}/**/*.js`)
    .filter((file) => !file.includes('.min.js'))

  logger.debug(`[PagesBuild]`)
  logger.debug(`Looking for CSS files in: ${cssPath}`)
  logger.debug(
    `Found ${cssFiles.length} CSS files:\n${cssFiles.map((f) => `            - ${f}`).join('\n')}`
  )

  logger.debug(`Looking for JS files in: ${jsPath}`)
  logger.debug(
    `Found ${jsFiles.length} JS files:\n${jsFiles.map((f) => `            - ${f}`).join('\n')}`
  )

  // Find JSON data files generated from Markdown.
  logger.debug(`Looking for JSON data files:`)
  const jsonPattern = path
    .join(config.datasetPagesBuild, '**/*.json')
    .replace(/\\/g, '/')
  const foundJsonFiles = glob.sync(jsonPattern)
  logger.debug(
    `Found ${foundJsonFiles.length} JSON data files: \n${foundJsonFiles.map((f) => `            - ${f}`).join('\n')}`
  )

  // Find direct Nunjucks template files, excluding layout files.
  logger.debug('Looking for direct .njk template files:')
  const njkPattern = path
    .join(config.routesBase, '**/*.njk')
    .replace(/\\/g, '/')
  const foundNjkFiles = glob.sync(njkPattern).filter((file) => {
    const basename = path.basename(file)
    return !basename.startsWith('layout-') && basename !== 'menu.njk'
  })
  logger.debug(
    `Found ${foundNjkFiles.length} direct .njk files: \n${foundNjkFiles.map((f) => `            - ${f}`).join('\n')}`
  )

  // Filter out JSON files that have corresponding .njk files (Nunjucks takes precedence).
  const njkOutputPaths = foundNjkFiles.map((file) => {
    const relativePath = path.relative(config.routesBase, file)
    return relativePath.replace('.njk', '.json')
  })

  const filteredJsonFiles = foundJsonFiles.filter((jsonFile) => {
    const relativePath = path.relative(config.datasetPagesBuild, jsonFile)
    const basename = path.basename(jsonFile)

    if (basename === 'menu.json' || basename.startsWith('layout-')) {
      logger.debug(`Skipping file ${jsonFile} - excluded from HTML generation`)
      return false
    }

    const hasNjkOverride = njkOutputPaths.includes(relativePath)
    if (hasNjkOverride) {
      logger.debug(`Skipping JSON file ${jsonFile} - .njk override exists`)
    }
    return !hasNjkOverride
  })

  // Combine filtered JSON files and direct .njk files for processing.
  const allInputFiles = [...filteredJsonFiles, ...foundNjkFiles]
  logger.debug(`Total input files after filtering: ${allInputFiles.length}`)

  // Define a generic path transformation function for injecting assets.
  const transformPath = function (filepath, tagType) {
    const buildDirName = path.basename(config.tplBuild())
    // Remove everything up to and including the buildDirName and following slash/backslash
    const idx = filepath.lastIndexOf(buildDirName)
    let cleanPath =
      idx !== -1 ? filepath.slice(idx + buildDirName.length) : filepath
    cleanPath = cleanPath.replace(/^[/\\]+/, '/')
    if (!cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath
    }
    logger.debug(
      `Transforming ${tagType.toUpperCase()} path: ${filepath} -> ${cleanPath}`
    )

    return tagType === 'css'
      ? `<link rel="stylesheet" href="${cleanPath}">`
      : `<script src="${cleanPath}"></script>`
  }

  // Prepare parameters for the htmlBuildFnc.
  const params = {
    input: allInputFiles,
    output: config.tplBuild(),
    processPaths: templatePaths,
    dataSource: config.datasetPagesBuild,
    routesBase: config.routesBase,
    injectCdnJs: config.injectCdnJs(),
    injectJs: jsFiles,
    injectCss: cssFiles,
    injectIgnorePath: config.buildBase(),
    relative: false,
    transformCss: (filepath) => transformPath(filepath, 'css'),
    transformJs: (filepath) => transformPath(filepath, 'js'),
    preserveStructure: true,
    specialPages: [],
    siteDefaults,
  }

  await htmlBuildFnc(params)
  return Promise.resolve()
}
