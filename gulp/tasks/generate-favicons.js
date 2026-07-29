import fs from 'node:fs/promises'
import path from 'node:path'
import favicons from 'favicons'

import loggerLib from '../utils/index.js'

const logger = loggerLib.createLogger('GenerateFavicons')

function assertOutputOverrides(outputDir, options) {
  const defaultManifestPath = path.join(outputDir, 'manifest.webmanifest')
  if (
    options.manifestPath &&
    path.resolve(options.manifestPath) !== path.resolve(defaultManifestPath) &&
    !options.manifestHref
  ) {
    throw new Error('manifestHref is required when manifestPath is relocated.')
  }
}

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
 * @param {object} [options] - Output placement overrides
 * @param {string} [options.rootIconPath] - Destination for root /favicon.ico
 * @param {string} [options.manifestPath] - Destination for root /manifest.webmanifest
 * @param {string} [options.faviconHtmlPath] - Destination for generated HTML snippet
 * @param {string} [options.manifestHref] - Public href used for the web manifest link
 * @returns {Promise<void>} Resolves when all files are written
 * @throws {Error} If the source image is missing or generation fails
 */
export default async function generateFavicons(
  sourcePath,
  outputDir,
  faviconConfig,
  options = {}
) {
  if (!sourcePath || !outputDir) {
    throw new Error('Favicon task skipped: invalid source or destination.', {
      cause: new Error(`src: ${sourcePath}, dest: ${outputDir}`),
    })
  }

  try {
    assertOutputOverrides(outputDir, options)

    await fs.access(sourcePath).catch((error) => {
      throw new Error(`Favicon source image not found at: ${sourcePath}`, {
        cause: error,
      })
    })
    logger.debug(`Found favicon source: ${sourcePath}`)

    await fs.mkdir(outputDir, { recursive: true })
    logger.debug('Starting generation with provided configuration...')

    const result = await favicons(sourcePath, faviconConfig)

    const activeWrites = []
    const snippetPath =
      options.faviconHtmlPath || path.join(outputDir, 'favicons.html')

    async function writeGeneratedFile(target, contents) {
      await fs.mkdir(path.dirname(target), { recursive: true })
      await fs.writeFile(target, contents)
    }

    result.images.forEach((image) => {
      activeWrites.push(
        writeGeneratedFile(path.join(outputDir, image.name), image.contents)
      )
      if (image.name === 'favicon.ico' && options.rootIconPath) {
        activeWrites.push(
          writeGeneratedFile(options.rootIconPath, image.contents)
        )
      }
    })

    result.files.forEach((file) => {
      const target =
        file.name === 'manifest.webmanifest' && options.manifestPath
          ? options.manifestPath
          : path.join(outputDir, file.name)
      activeWrites.push(writeGeneratedFile(target, file.contents))
    })

    if (result.html && result.html.length > 0) {
      const faviconHtml = result.html
        .filter(
          (line) =>
            !options.rootIconPath || !/href="[^"]*favicon\.ico"/.test(line)
        )
        .map((line) =>
          options.manifestHref
            ? line.replace(
                /href="[^"]*manifest\.webmanifest"/,
                `href="${options.manifestHref}"`
              )
            : line
        )
      activeWrites.push(
        writeGeneratedFile(snippetPath, `${faviconHtml.join('\n')}\n`)
      )
    }

    await Promise.all(activeWrites)

    logger.list(`Favicon generation successful`, [
      `${result.images.length} images created`,
      `${result.files.length} metadata files created`,
      `HTML snippet generated: ${snippetPath}`,
    ])
  } catch (error) {
    logger.error(`Favicon generation process failed. Cause: ${error.message}`)
    throw error
  }
}
