import fs from 'node:fs/promises'
import path from 'node:path'

import loggerLib, { getRelativePath } from '../utils/index.js'

const logger = loggerLib.createLogger('ProcessFonts')

function resolveFontTargets(outputDir, pluginConfig, minify) {
  const fontsDir = path.join(
    outputDir,
    pluginConfig.fontsDir || 'assets/fonts/'
  )
  let cssTargetName = pluginConfig.cssFilename || 'fonts.css'
  if (minify && !cssTargetName.includes('.min.')) {
    cssTargetName = cssTargetName.replace('.css', '.min.css')
  }

  return {
    fontsDir,
    cssFile: path.join(
      outputDir,
      pluginConfig.cssDir || 'assets/css/',
      cssTargetName
    ),
  }
}

async function hasAnyFontAsset(fontsDir) {
  try {
    const entries = await fs.readdir(fontsDir, { withFileTypes: true })
    return entries.some(function hasFontAsset(entry) {
      return entry.isFile() && !entry.name.startsWith('.')
    })
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false
    }
    throw error
  }
}

async function verifyReferencedFontAssets(cssFile, fontsDir) {
  const css = await fs.readFile(cssFile, 'utf8')
  const localUrls = [...css.matchAll(/url\(([^)]+)\)/gi)]
    .map((match) => match[1].trim().replace(/^(['"])(.*)\1$/, '$2'))
    .filter((url) => !/^(?:data:|https?:|\/\/|#)/i.test(url))
    .map((url) => url.split(/[?#]/, 1)[0])

  // URLs are resolved by the browser against the CSS location, but the
  // fontload convention writes them relative to the assets root instead.
  const baseDirs = [path.dirname(cssFile), path.dirname(path.resolve(fontsDir))]

  await Promise.all(
    localUrls.map(async (url) => {
      const errors = []
      for (const baseDir of baseDirs) {
        try {
          await fs.access(path.resolve(baseDir, url))
          return
        } catch (error) {
          errors.push(error)
        }
      }
      throw new Error(`Referenced font asset not found: ${url}`, {
        cause: errors[0],
      })
    })
  )
}

async function shouldSkipCachedFonts(input, cssFile, fontsDir) {
  try {
    await fs.access(cssFile)
    await fs.access(fontsDir)

    const inputStats = await fs.stat(input)
    const cssStats = await fs.stat(cssFile)
    const hasFontFiles = await hasAnyFontAsset(fontsDir)
    const isCssFromFuture = cssStats.mtime > new Date(Date.now() + 5000)

    if (isCssFromFuture) {
      logger.warn(
        `Font cache file ${getRelativePath(cssFile)} has a future timestamp. Forcing rebuild.`
      )
      return false
    }

    if (inputStats.mtime <= cssStats.mtime && hasFontFiles) {
      await verifyReferencedFontAssets(cssFile, fontsDir)
      logger.debug(
        `Fonts are up to date, skipping local font asset verification for ${getRelativePath(cssFile)}.`
      )
      return true
    }
  } catch {
    return false
  }

  return false
}

async function ensureFontDefinitionIsNotEmpty(input) {
  const stats = await fs.stat(input)
  if (stats.size === 0) {
    logger.warn(
      `Font definition file ${getRelativePath(input)} is empty. Skipping font task.`
    )
    return false
  }

  return true
}

/**
 * Gulp Task: Verifies locally managed font assets.
 * Legacy remote download flow via gulp-google-webfonts has been removed.
 * @param {string} input - Path to font definition file
 * @param {string} outputDir - Destination directory for fonts and styles
 * @param {object} [options] - Task options
 * @param {object} [options.config] - Local font target configuration
 * @param {boolean} [options.minify] - Whether minified CSS target name should be used
 * @returns {Promise<void>} Resolves when verification completes
 */
export default async function processFonts(input, outputDir, options = {}) {
  if (!input || !outputDir) {
    logger.warn('Font task skipped: invalid input or output parameters.')
    return
  }

  const fontDefinitionPath = path.resolve(input)

  try {
    await fs.access(fontDefinitionPath)
    if (!(await ensureFontDefinitionIsNotEmpty(fontDefinitionPath))) {
      return
    }

    const { config: pluginConfig = {}, minify = false } = options
    const { fontsDir, cssFile } = resolveFontTargets(
      outputDir,
      pluginConfig,
      minify
    )

    if (await shouldSkipCachedFonts(fontDefinitionPath, cssFile, fontsDir)) {
      return
    }

    await fs.access(cssFile)

    const hasFontFiles = await hasAnyFontAsset(fontsDir)
    if (!hasFontFiles) {
      logger.warn(
        `No local font binaries found in ${getRelativePath(fontsDir)}.`
      )
      return
    }

    await verifyReferencedFontAssets(cssFile, fontsDir)

    logger.verbose(
      `Using local font assets from ${getRelativePath(fontsDir)} and ${getRelativePath(cssFile)}.`
    )
  } catch (error) {
    throw new Error('Local font assets are missing or inaccessible.', {
      cause: error,
    })
  }
}
