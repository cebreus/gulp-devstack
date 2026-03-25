import { buildBase, routesBase } from '../config.js'
import logger from '../utils/logger.js'
import { glob } from 'glob'
import fs from 'node:fs/promises'
import path from 'node:path'
import pc from 'picocolors'

/**
 * Diagnostic async function for checking file status and content.
 * Helps with debugging build and template issues.
 * @returns {Promise<void>}
 */
export default async function debugFiles() {
  // Check for all files in the routes directory.
  const routesGlob = `${routesBase}/**/*.*`
  const routesFiles = await glob(routesGlob)
  const filesLog = await Promise.all(
    routesFiles.map(async (file) => {
      const exists = await fs
        .access(file)
        .then(() => true)
        .catch(() => false)
      return `            - ${file} (${exists ? 'exists' : '(NOT FOUND!)'})`
    })
  )
  logger.debug(
    `Starting debug files in routes directory (${routesBase}):\n${filesLog.join('\n')}`
  )
  for (const file of routesFiles) {
    const exists = await fs
      .access(file)
      .then(() => true)
      .catch(() => false)
    if (!exists) {
      logger.warn(`   Warning: File referenced but not found at path: ${file}`)
    }
  }

  // Check for the main index.njk template.
  const indexNjk = path.join(routesBase, 'index.njk')
  const indexExists = await fs
    .access(indexNjk)
    .then(() => true)
    .catch(() => false)
  logger.debug(
    `Checking index.njk: ${indexExists ? '(exists)' : '(NOT FOUND!)'}`
  )

  // If the index.njk template exists, show a preview of its content.
  if (indexExists) {
    const content = await fs.readFile(indexNjk, 'utf8')
    logger.debug(`${pc.dim(content.replaceAll(/\s+/g, ' ').substring(0, 100))}`)
  } else {
    logger.warn(
      'WARNING: Main index.njk template not found. This may cause build failures.'
    )
  }

  // Check for the generated HTML files in the build directory.
  const buildHtmlGlob = path.join(buildBase(), '**/*.html')
  const buildFiles = await glob(buildHtmlGlob)
  if (buildFiles.length === 0) {
    logger.warn('No HTML files found in build directory!')
  } else {
    logger.debug(
      `Generated HTML files in build directory:\n` +
        buildFiles.map((file) => `            - ${file}`).join('\n')
    )
  }

  // Check for the main index.html output file.
  const indexHtml = path.join(buildBase(), 'index.html')
  const indexHtmlExists = await fs
    .access(indexHtml)
    .then(() => true)
    .catch(() => false)
  logger.debug(
    `Checking build/index.html: ${indexHtmlExists ? '(exists)' : '(NOT FOUND!)'}`
  )

  if (!indexHtmlExists) {
    logger.warn(
      'WARNING: Main index.html not generated. Build process may have failed.'
    )
  }

  // Provide a summary of the debug analysis.
  logger.verbose(`Debug Summary:
            - Source files found: ${routesFiles.length}
            - HTML files generated: ${buildFiles.length}
            - Main template status: ${indexExists ? 'OK' : 'MISSING'}
            - Main output status: ${indexHtmlExists ? 'OK' : 'MISSING'}`)
}
