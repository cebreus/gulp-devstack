import fs from 'node:fs/promises'
import path from 'node:path'
import favicons from 'favicons'

import loggerLib from '../utils/index.js'

const logger = loggerLib.createLogger('GenerateFavicons')

/**
 * Gulp Task: Generates favicons and related metadata from a source image.
 * Uses the 'favicons' package to produce multiple formats (ico, png, webmanifest).
 * @param {string} sourcePath - Path to the high-resolution source logo
 * @param {string} outputDir - Destination directory for generated assets
 * @param {object} faviconConfig - Configuration object for the generator
 * @param {string} faviconConfig.appName - Name of the application
 * @param {string} faviconConfig.appShortName - Short name of the application
 * @param {string} faviconConfig.appDescription - Description of the application
 * @param {string} faviconConfig.developerName - Name of the developer
 * @param {string} faviconConfig.background - Background color for tiles
 * @param {string} faviconConfig.path - Path for assets in HTML and manifest
 * @param {string} faviconConfig.display - Preferred display mode
 * @param {object} faviconConfig.icons - Icons to generate
 * @param {boolean} faviconConfig.icons.android - Generate Android-specific icons
 * @param {boolean} faviconConfig.icons.appleIcon - Generate Apple-specific icons
 * @param {boolean} faviconConfig.icons.windows - Generate Windows-specific icons
 * @param {boolean} faviconConfig.icons.favicons - Generate standard favicons
 * @param {string} [faviconConfig.url] - URL to the application root
 * @returns {Promise<void>} Resolves when all files are written
 * @throws {Error} If the source image is missing or generation fails
 */
export async function generateFavicons(sourcePath, outputDir, faviconConfig) {
  if (!sourcePath || !outputDir) {
    throw new Error('Favicon task skipped: invalid source or destination.', {
      cause: new Error(`src: ${sourcePath}, dest: ${outputDir}`),
    })
  }

  try {
    try {
      await fs.access(sourcePath)
      logger.debug(`Found favicon source: ${sourcePath}`)
    } catch {
      throw new Error(`Favicon source image not found at: ${sourcePath}`, {
        cause: new Error('Ensure the source image exists in src/assets/icons/'),
      })
    }

    await fs.mkdir(outputDir, { recursive: true })
    logger.debug('Starting generation with provided configuration...')

    const result = await favicons(sourcePath, faviconConfig)

    const activeWrites = []

    result.images.forEach((image) => {
      const target = path.join(outputDir, image.name)
      activeWrites.push(fs.writeFile(target, image.contents))
    })

    result.files.forEach((file) => {
      const target = path.join(outputDir, file.name)
      activeWrites.push(fs.writeFile(target, file.contents))
    })

    if (result.html && result.html.length > 0) {
      const snippetPath = path.join(outputDir, 'favicons.html')
      activeWrites.push(fs.writeFile(snippetPath, result.html.join('\n')))
    }

    await Promise.all(activeWrites)

    logger.list(`Favicon generation successful`, [
      `${result.images.length} images created`,
      `${result.files.length} metadata files created`,
      `HTML snippet generated: ${path.join(outputDir, 'favicons.html')}`,
    ])
  } catch (error) {
    logger.error(`Favicon generation process failed. Cause: ${error.message}`)
    throw error
  }
}

export default generateFavicons
