import * as config from '../config.js'
import {
  ensureDirectoryExists,
  getRelativePath,
  handleEmptyPaths,
} from '../utils/helpers.js'
import logger from '../utils/logger.js'
import compileSass from './compile-sass.js'
import { glob } from 'glob'
import fs from 'node:fs'
import path from 'node:path'
import pc from 'picocolors'

/**
 * Generates a manifest file that imports all component SCSS files
 * and compiles them into one components.css file using the existing SASS compilation function.
 * Uses async/await and project helpers for maintainability and clarity.
 * @returns {Promise<*>} Gulp stream or null
 */
export default async function compileAllComponentStyles() {
  try {
    // Find all component SCSS files.
    const componentScssPattern = path.join(config.componentsPath, '**/*.scss')
    const componentFiles = await glob(componentScssPattern)

    logger.debug(`[ComponentsCSS] Found ${componentFiles.length} SCSS files`)

    if (
      handleEmptyPaths(componentFiles, '[ComponentsCSS] No SCSS files found')
    ) {
      await ensureDirectoryExists(config.sassBuild(), logger)
      const outPath = path.join(config.sassBuild(), 'components.css')
      await fs.promises.writeFile(outPath, '// No components available')
      logger.verbose(
        `[ComponentsCSS] Wrote empty components.css to ${getRelativePath(outPath)}`
      )
      return null
    }

    // Generate import statements for each component file using absolute paths.
    const imports = componentFiles.map((file) => {
      const absolutePath = path.resolve(file)
      return `@import "${absolutePath}";`
    })

    // Create the content for the manifest file.
    const manifestContent = `
// This file is auto-generated - do not edit
// It contains imports for all component SCSS files
// Last updated: ${new Date().toLocaleString('en-US')}

${imports.join('\n')}
    `.trim()

    // Create a temporary directory for the component manifest.
    const tempDir = path.join(config.tempBase, 'scss')
    await ensureDirectoryExists(tempDir, logger)

    // Write the temporary manifest file for compilation.
    const manifestPath = path.join(tempDir, 'components.scss')
    await fs.promises.writeFile(manifestPath, manifestContent)

    logger.debug(
      `[ComponentsCSS] Generated SCSS manifest: ${pc.yellow(getRelativePath(manifestPath))}`
    )

    // Use the existing compileSass function to compile the component styles.
    const sassOptions = {
      includePaths: [
        path.resolve('./src'),
        path.resolve(config.sassBase),
        path.resolve(config.componentsPath),
        path.resolve('./'),
      ],
    }

    const relativeIncludePaths = sassOptions.includePaths.map((p) =>
      getRelativePath(p)
    )
    const includePathsStr = relativeIncludePaths.filter(Boolean).join(', ')
    logger.debug(`[ComponentsCSS] Include paths: ${includePathsStr}`)

    const result = await compileSass(
      manifestPath,
      config.sassBuild(),
      'components.css',
      config.postcssPluginsBase(),
      {
        sassOptions,
      }
    )
    logger.verbose(
      `[ComponentsCSS] Styles compiled to ${pc.yellow(getRelativePath(path.join(config.sassBuild(), 'components.css')))}`
    )
    return result
  } catch (error) {
    logger.error('[ComponentsCSS] Error processing SCSS:', error)
    return null
  }
}
