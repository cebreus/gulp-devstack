import fs, { glob } from 'node:fs/promises'
import path from 'node:path'
import pc from 'picocolors'

import { buildBase, routesBase } from '../config.js'
import loggerLib from '../utils/logger.js'

const logger = loggerLib.createLogger('Debug')

/**
 * Diagnostic task for verifying the build pipeline state and file existence.
 * Scans key directories and reports potential issues with templates or generated output.
 * @returns {Promise<void>} Resolves when the diagnostic report is complete
 */
export async function debugBuild() {
  logger.info(`${pc.blue('---')} Build Diagnostic Report ${pc.blue('---')}`)
  // 1. Audit Route Templates
  const routesGlobPattern = `${routesBase}/**/*.*`.replace(/\\/g, '/')
  const foundRouteFiles = await Array.fromAsync(glob(routesGlobPattern))

  logger.debug(`Found ${foundRouteFiles.length} source files in ${routesBase}`)

  for (const filePath of foundRouteFiles) {
    try {
      await fs.access(filePath)
    } catch {
      logger.warn(`Source file missing: ${pc.red(filePath)}`)
    }
  }

  // 2. Audit Main Entry Point
  const indexTemplatePath = path.join(routesBase, 'index.njk')
  try {
    const templateExists = await fs
      .access(indexTemplatePath)
      .then(() => true)
      .catch(() => false)
    if (templateExists) {
      const templateSnippet = await fs.readFile(indexTemplatePath, 'utf8')
      const sanitizedSnippet = templateSnippet
        .replace(/\s+/g, ' ')
        .substring(0, 100)
      logger.verbose(
        `Main template (index.njk) prefix: ${pc.dim(sanitizedSnippet)}...`
      )
    } else {
      logger.warn(`Critical missing template: ${pc.bold(indexTemplatePath)}`)
    }
  } catch (error) {
    logger.error('Failed to audit index.njk template', error)
  }

  // 3. Audit Generated HTML Output
  const buildDir = buildBase()
  const generatedHtmlGlob = path.join(buildDir, '**/*.html').replace(/\\/g, '/')
  const foundHtmlFiles = await Array.fromAsync(glob(generatedHtmlGlob))

  if (foundHtmlFiles.length === 0) {
    logger.warn(`No HTML output found in ${pc.yellow(buildDir)}!`)
  } else {
    logger.debug(`Build artifact count: ${foundHtmlFiles.length} HTML files.`)
  }

  const indexOutputPath = path.join(buildDir, 'index.html')
  const indexOutputExists = await fs
    .access(indexOutputPath)
    .then(() => true)
    .catch(() => false)

  if (!indexOutputExists) {
    logger.error(
      `Critical build failure: ${pc.bold(indexOutputPath)} was NOT generated.`
    )
  }

  // 4. Report Summary
  logger.list('Debug Report Summary', [
    `Patterns Scanned: ${foundRouteFiles.length}`,
    `Artifacts Found: ${foundHtmlFiles.length}`,
    `Entry Point State: ${indexOutputExists ? pc.green('READY') : pc.red('MISSING')}`,
  ])
}

export default debugBuild
