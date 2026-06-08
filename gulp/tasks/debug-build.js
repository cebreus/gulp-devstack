import fs from 'node:fs/promises'
import path from 'node:path'
import { glob } from 'glob'
import pc from 'picocolors'

import loggerLib, { isPrivateFile } from '../utils/index.js'

const logger = loggerLib.createLogger('DebugBuild')

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

async function findRouteFiles(activeRoutesBase) {
  const routesGlobPattern = `${activeRoutesBase}/**/*.*`.replace(/\\/g, '/')
  const foundRouteFiles = await glob(routesGlobPattern)
  return foundRouteFiles.filter((filePath) => !isPrivateFile(filePath))
}

async function auditSourceFiles(foundRouteFiles) {
  logger.debug(
    `Found ${foundRouteFiles.length} source files in ${foundRouteFiles[0] ? path.dirname(foundRouteFiles[0]) : 'routes base'}`
  )

  for (const filePath of foundRouteFiles) {
    try {
      await fs.access(filePath)
    } catch {
      logger.warn(`Source file missing: ${pc.red(filePath)}`)
    }
  }
}

async function auditIndexTemplate(activeRoutesBase) {
  const indexTemplatePath = path.join(activeRoutesBase, 'index.njk')

  try {
    if (!(await pathExists(indexTemplatePath))) {
      logger.warn(`Critical missing template: ${pc.bold(indexTemplatePath)}`)
      return
    }

    const templateSnippet = await fs.readFile(indexTemplatePath, 'utf8')
    const sanitizedSnippet = templateSnippet
      .replace(/\s+/g, ' ')
      .substring(0, 100)
    logger.verbose(
      `Main template (index.njk) prefix: ${pc.dim(sanitizedSnippet)}...`
    )
  } catch (error) {
    logger.error(`Failed to audit index.njk template. Cause: ${error.message}`)
  }
}

async function auditBuildArtifacts(buildDir) {
  const generatedHtmlGlob = path.join(buildDir, '**/*.html').replace(/\\/g, '/')
  const foundHtmlFiles = await glob(generatedHtmlGlob)

  if (foundHtmlFiles.length === 0) {
    logger.warn(
      `No HTML output found in ${pc.yellow(buildDir)}. Run a full build and verify route templates are discoverable.`
    )
  } else {
    logger.debug(`Build artifact count: ${foundHtmlFiles.length} HTML files.`)
  }

  const indexOutputPath = path.join(buildDir, 'index.html')
  const indexOutputExists = await pathExists(indexOutputPath)

  if (!indexOutputExists) {
    logger.error(
      `Critical build failure: ${pc.bold(indexOutputPath)} was NOT generated.`
    )
  }

  return {
    foundHtmlFiles,
    indexOutputExists,
  }
}

function logDebugSummary(foundRouteFiles, foundHtmlFiles, indexOutputExists) {
  logger.list('Debug Report Summary', [
    `Patterns Scanned: ${foundRouteFiles.length}`,
    `Artifacts Found: ${foundHtmlFiles.length}`,
    `Entry Point State: ${indexOutputExists ? pc.green('READY') : pc.red('MISSING')}`,
  ])
}

/**
 * Diagnostic task for verifying the build pipeline state and file existence.
 * Scans key directories and reports potential issues with templates or generated output.
 * @param {object} config - Configuration object
 * @param {string} config.routesBase - Base directory for routes
 * @param {object} config.paths - Path mapping object
 * @param {string} config.paths.build - Root build directory
 * @param {object} [options] - Options for the diagnostic task
 * @param {string} [options.routesBaseOverride] - Override for routes base directory
 * @param {string} [options.buildBaseOverride] - Override for build base directory path
 * @returns {Promise<void>} Resolves when the diagnostic report is complete
 */
export default async function debugBuild(config, options = {}) {
  const activeRoutesBase = options.routesBaseOverride || config.routesBase
  const buildDir = options.buildBaseOverride || config.paths.build

  logger.info(`${pc.blue('---')} Build Diagnostic Report ${pc.blue('---')}`)

  if (!(await pathExists(activeRoutesBase))) {
    logger.warn(`Source directory missing: ${pc.red(activeRoutesBase)}`)
    return
  }

  const foundRouteFiles = await findRouteFiles(activeRoutesBase)
  logger.debug(
    `Found ${foundRouteFiles.length} source files in ${activeRoutesBase}`
  )
  await auditSourceFiles(foundRouteFiles)
  await auditIndexTemplate(activeRoutesBase)

  if (!(await pathExists(buildDir))) {
    logger.warn(`Build directory missing: ${pc.red(buildDir)}`)
    return
  }

  const { foundHtmlFiles, indexOutputExists } =
    await auditBuildArtifacts(buildDir)
  logDebugSummary(foundRouteFiles, foundHtmlFiles, indexOutputExists)
}
