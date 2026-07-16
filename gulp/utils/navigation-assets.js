import fs from 'node:fs'
import path from 'node:path'

import { resolveInjectionUrl } from './html-output.js'

const ASSET_MANIFEST_CACHE = new Map()

function normalizeAssetEntry(entry) {
  return entry.replace(/\\/g, '/')
}

function getAssetCandidateNames(routeRelDir, routeBaseName, extensions) {
  let pageAssetName = routeRelDir !== '.' ? routeRelDir : routeBaseName
  if (pageAssetName === 'index') {
    pageAssetName = 'home'
  }

  if (routeRelDir !== '.') {
    return [
      ...extensions.map((ext) => `${routeRelDir}/${routeBaseName}${ext}`),
      ...extensions.map((ext) => `${pageAssetName}${ext}`),
      ...extensions.map((ext) => `${pageAssetName}/index${ext}`),
    ]
  }

  return [
    ...extensions.map((ext) => `${routeBaseName}${ext}`),
    ...extensions.map((ext) => `${pageAssetName}${ext}`),
    ...extensions.map((ext) => `${pageAssetName}/index${ext}`),
  ]
}

async function getAssetManifest(assetDir) {
  if (ASSET_MANIFEST_CACHE.has(assetDir)) {
    return ASSET_MANIFEST_CACHE.get(assetDir)
  }

  try {
    const entries = await fs.promises.readdir(assetDir, { recursive: true })
    const manifest = new Set(entries.map(normalizeAssetEntry))
    ASSET_MANIFEST_CACHE.set(assetDir, manifest)
    return manifest
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null
    }
    throw new Error(`Failed to read asset directory: ${assetDir}`, {
      cause: error,
    })
  }
}

async function discoverRouteAssets(
  routeRelDir,
  routeBaseName,
  outputBase,
  { subDir = 'css', extensions = ['.css'] } = {}
) {
  const assetDir = path.resolve(outputBase, 'assets', subDir)
  const manifest = await getAssetManifest(assetDir)
  if (!manifest) {
    return []
  }

  const discovered = []
  for (const name of getAssetCandidateNames(
    routeRelDir,
    routeBaseName,
    extensions
  )) {
    const normalizedName = normalizeAssetEntry(name)
    if (!manifest.has(normalizedName)) {
      continue
    }

    const fullPath = path.resolve(assetDir, normalizedName)
    const url = resolveInjectionUrl(fullPath, outputBase)
    if (!discovered.includes(url)) {
      discovered.push(url)
    }
  }

  return discovered
}

/**
 * Clears cached route asset manifests before HTML rerendering.
 * @returns {void}
 */
export function clearRouteAssetCache() {
  ASSET_MANIFEST_CACHE.clear()
}

/**
 * Discovers and returns URL paths for route-specific CSS assets.
 * @param {string} routeRelDir - Relative directory of the route.
 * @param {string} routeBaseName - Base name of the route file.
 * @param {string} outputBase - Build output directory.
 * @returns {Promise<string[]>} Discovered style URLs.
 */
export async function discoverRouteStyles(
  routeRelDir,
  routeBaseName,
  outputBase
) {
  return discoverRouteAssets(routeRelDir, routeBaseName, outputBase, {
    subDir: 'css',
    extensions: ['.css', '.min.css'],
  })
}

/**
 * Discovers and returns URL paths for route-specific JS assets.
 * @param {string} routeRelDir - Relative directory of the route.
 * @param {string} routeBaseName - Base name of the route file.
 * @param {string} outputBase - Build output directory.
 * @returns {Promise<string[]>} Discovered script URLs.
 */
export async function discoverRouteScripts(
  routeRelDir,
  routeBaseName,
  outputBase
) {
  return discoverRouteAssets(routeRelDir, routeBaseName, outputBase, {
    subDir: 'js',
    extensions: ['.js'],
  })
}

const navigationAssetsApi = {
  clearRouteAssetCache,
  discoverRouteScripts,
  discoverRouteStyles,
}

export default navigationAssetsApi
