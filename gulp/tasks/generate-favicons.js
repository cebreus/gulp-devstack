import fs from 'node:fs/promises'
import path from 'node:path'
import favicons from 'favicons'

import loggerLib from '../utils/logger.js'

const logger = loggerLib.createLogger('Favicons')

/**
 * Gulp Task: Generates favicons and related metadata from a source image.
 * Uses the 'favicons' package to produce multiple formats (ico, png, webmanifest).
 * @param {string} sourcePath - Path to the high-resolution source logo
 * @param {string} outputDir - Destination directory for generated assets
 * @param {object} faviconConfig - Configuration object for the generator
 * @returns {Promise<void>} Resolves when all files are written
 * @throws {Error} If the source image is missing or generation fails
 */
export async function generateFavicons(sourcePath, outputDir, faviconConfig) {
  if (!sourcePath || !outputDir) {
    throw new Error(
      'Favicon task requires both sourcePath and outputDir parameters.'
    )
  }

  try {
    // 1. Verification
    try {
      await fs.access(sourcePath)
      logger.debug(`Found favicon source: ${sourcePath}`)
    } catch {
      throw new Error(`Favicon source image not found at: ${sourcePath}`)
    }

    // 2. Preparation
    await fs.mkdir(outputDir, { recursive: true })
    logger.debug('Starting generation with provided configuration...')

    // 3. Execution (The actual heavy lifting)
    const result = await favicons(sourcePath, faviconConfig)

    // 4. Persistence - write images
    const activeWrites = []

    result.images.forEach((image) => {
      const target = path.join(outputDir, image.name)
      activeWrites.push(fs.writeFile(target, image.contents))
    })

    // 5. Persistence - write metadata files (manifest, browserconfig)
    result.files.forEach((file) => {
      const target = path.join(outputDir, file.name)
      activeWrites.push(fs.writeFile(target, file.contents))
    })

    // 6. Persistence - write helper HTML snippet
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
    logger.error('Favicon generation process failed!', error)
    throw error
  }
}

export default generateFavicons
