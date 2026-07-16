import fs from 'node:fs/promises'
import path from 'node:path'

import { siteDefaults } from '../../src/config/site.js'
import { toPosixPath } from './core.js'

const ROUTE_DATA_ARTIFACTS_DIRNAME = 'pages'
const SITE_DATA_ARTIFACT_FILENAME = 'site.json'
const MENU_DATA_ARTIFACT_FILENAME = 'menu.json'

/**
 * Returns the directory that stores route data artifacts.
 * @param {string} tempBase - Temporary build directory.
 * @returns {string} Route data artifacts directory.
 */
export function getRouteDataArtifactsDir(tempBase) {
  return path.join(tempBase, ROUTE_DATA_ARTIFACTS_DIRNAME)
}

/**
 * Returns the path to the site metadata artifact.
 * @param {string} tempBase - Temporary build directory.
 * @returns {string} Site data artifact path.
 */
export function getSiteDataArtifactPath(tempBase) {
  return path.join(tempBase, SITE_DATA_ARTIFACT_FILENAME)
}

function getMenuDataArtifactPath(artifactsBase) {
  return path.join(artifactsBase, MENU_DATA_ARTIFACT_FILENAME)
}

/**
 * Returns the path to a route page data artifact.
 * @param {object} options - Artifact parameters.
 * @param {string} options.artifactsBase - Route data artifacts directory.
 * @param {string} options.routesBase - Routes source directory.
 * @param {string} options.filePath - Route file path.
 * @returns {string} Page data artifact path.
 */
export function getPageDataArtifactPath({
  artifactsBase,
  routesBase,
  filePath,
}) {
  const relativeFilePath = path.relative(routesBase, filePath)
  const outputFileName = relativeFilePath.replace(
    path.extname(filePath),
    '.json'
  )
  return path.join(artifactsBase, outputFileName)
}

async function readJsonArtifact(targetPath, fallbackValue) {
  try {
    const content = await fs.readFile(targetPath, 'utf8')
    return JSON.parse(content)
  } catch (error) {
    if (error.code === 'ENOENT') {
      return fallbackValue
    }

    throw new Error(`Failed to read route artifact: ${targetPath}`, {
      cause: error,
    })
  }
}

/**
 * Loads the page-data artifact for a route file.
 * @param {object} options - Artifact parameters.
 * @param {string} options.artifactsBase - Route data artifacts directory.
 * @param {string} options.routesBase - Routes source directory.
 * @param {string} options.filePath - Route file path.
 * @returns {Promise<Record<string, unknown>>} Parsed page data or an empty object.
 */
export async function loadPageDataArtifact({
  artifactsBase,
  routesBase,
  filePath,
}) {
  const artifactPath = getPageDataArtifactPath({
    artifactsBase,
    routesBase,
    filePath,
  })

  return readJsonArtifact(artifactPath, {})
}

/**
 * Loads the global site and menu artifacts used by HTML rendering.
 * @param {string} tempBase - Temporary build directory.
 * @returns {Promise<{siteData: Record<string, unknown>, menuData: Record<string, unknown>}>} Parsed site and menu artifacts for template rendering.
 */
export async function loadRouteArtifactsContext(tempBase) {
  const artifactsBase = getRouteDataArtifactsDir(tempBase)
  const [siteData, menuData] = await Promise.all([
    readJsonArtifact(getSiteDataArtifactPath(tempBase), {}),
    readJsonArtifact(getMenuDataArtifactPath(artifactsBase), {}),
  ])

  return { siteData, menuData }
}

/**
 * Writes a page-data artifact for a route file.
 * @param {object} options - Artifact parameters.
 * @param {string} options.artifactsBase - Route data artifacts directory.
 * @param {string} options.routesBase - Routes source directory.
 * @param {string} options.filePath - Route file path.
 * @param {Record<string, unknown>} options.pageData - Normalized page payload.
 * @returns {Promise<string>} Written artifact path.
 */
export async function writePageDataArtifact({
  artifactsBase,
  routesBase,
  filePath,
  pageData,
}) {
  const artifactPath = getPageDataArtifactPath({
    artifactsBase,
    routesBase,
    filePath,
    pageData,
  })

  await fs.mkdir(path.dirname(artifactPath), { recursive: true })
  await fs.writeFile(artifactPath, JSON.stringify(pageData, null, 2))

  return artifactPath
}

/**
 * Writes the shared menu artifact.
 * @param {string} artifactsBase - Route data artifacts directory.
 * @param {object[]} menuEntries - Raw route menu entries.
 * @returns {Promise<string>} Written artifact path.
 */
export async function writeMenuDataArtifact(artifactsBase, menuEntries) {
  const menuFile = getMenuDataArtifactPath(artifactsBase)
  const menuData = buildMenuData(menuEntries)

  await fs.mkdir(path.dirname(menuFile), { recursive: true })
  await fs.writeFile(menuFile, JSON.stringify(menuData, null, 2))

  return menuFile
}

/**
 * Resolves route-relative folder and final page path for a content file.
 * @param {string} filePath - Absolute path to the source file.
 * @param {string} fileName - Source file name without extension.
 * @param {string} [routesRoot] - Routes root directory.
 * @returns {{ relativeDir: string, pagePath: string }} Route location metadata.
 */
export function resolvePageLocation(
  filePath,
  fileName,
  routesRoot = './src/routes'
) {
  const absoluteRoutesRoot = toPosixPath(path.resolve(routesRoot))
  const absoluteFilePath = toPosixPath(path.resolve(filePath))

  const isRouteFile = absoluteFilePath.startsWith(absoluteRoutesRoot)
  const relativeDir = isRouteFile
    ? toPosixPath(
        path.relative(absoluteRoutesRoot, path.dirname(absoluteFilePath))
      )
    : ''

  let pagePath = relativeDir !== '' ? `/${relativeDir}/` : '/'
  if (fileName !== 'index') {
    pagePath = toPosixPath(path.join(pagePath, fileName))
    if (!pagePath.startsWith('/')) {
      pagePath = `/${pagePath}`
    }
  }

  return { relativeDir, pagePath }
}

function deepTrimStrings(input) {
  if (typeof input === 'string') {
    return input.trim()
  }
  if (Array.isArray(input)) {
    return input.map(deepTrimStrings)
  }
  if (input instanceof Date) {
    return input
  }
  if (input && typeof input === 'object') {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [key, deepTrimStrings(value)])
    )
  }
  return input
}

/**
 * Builds the context used to resolve frontmatter expressions.
 * @param {object} options - Context parameters.
 * @param {Record<string, unknown>} [options.frontmatter] - Page frontmatter.
 * @param {Record<string, unknown>} [options.siteConfig] - Site metadata.
 * @returns {{ site: Record<string, unknown>, page: Record<string, unknown> }} Expression context.
 */
export function buildRouteExpressionContext({
  frontmatter = {},
  siteConfig = siteDefaults,
}) {
  return {
    site: { ...siteConfig },
    page: { ...frontmatter },
  }
}

function normalizeToAbsoluteUrl(url, baseUrl) {
  if (!url || /^https?:\/\//.test(url) || !baseUrl) {
    return url
  }
  return `${baseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`
}

function resolveMetadataUrls(data, baseUrl) {
  const IMAGE_KEYS = new Set(['image', 'images', 'thumbnail', 'url'])
  if (typeof data === 'string') {
    return normalizeToAbsoluteUrl(data, baseUrl)
  }
  if (Array.isArray(data)) {
    return data.map((item) => resolveMetadataUrls(item, baseUrl))
  }
  if (data && typeof data === 'object') {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        IMAGE_KEYS.has(key) || (value && typeof value === 'object')
          ? resolveMetadataUrls(value, baseUrl)
          : value,
      ])
    )
  }
  return data
}

/**
 * Applies canonical and social metadata defaults to page data.
 * @param {Record<string, unknown>} jsonData - Existing normalized page data.
 * @param {string} pagePath - Calculated page path.
 * @param {object} [siteConfig] - Site configuration.
 * @param {string} siteConfig.baseUrl - Base URL.
 * @returns {Record<string, unknown>} Enriched page data.
 */
export function applySeoDefaults(
  jsonData,
  pagePath,
  siteConfig = siteDefaults
) {
  const baseNoSlash = (siteConfig.baseUrl || '').replace(/\/$/, '')
  const pageCanonicalUrl = `${baseNoSlash}${pagePath}`

  return {
    ...jsonData,
    seo: {
      canonicalSelf: pageCanonicalUrl,
      ...(typeof jsonData.seo === 'object' ? jsonData.seo : {}),
    },
    openGraph: {
      url: pageCanonicalUrl,
      ...resolveMetadataUrls(
        typeof jsonData.openGraph === 'object' ? jsonData.openGraph : {},
        siteConfig.baseUrl
      ),
    },
    twitterCards: {
      url: pageCanonicalUrl,
      ...resolveMetadataUrls(
        typeof jsonData.twitterCards === 'object' ? jsonData.twitterCards : {},
        siteConfig.baseUrl
      ),
    },
  }
}

function buildMenuData(menuEntries) {
  return {
    menu: [...menuEntries].sort(function compareMenuOrder(left, right) {
      return left.order - right.order
    }),
  }
}

/**
 * Builds normalized page payload from parsed markdown frontmatter and content.
 * @param {object} options - Processing parameters.
 * @param {Record<string, unknown>} options.frontmatter - Parsed frontmatter fields.
 * @param {string} options.content - Markdown content.
 * @param {string} options.fileName - Source file name without extension.
 * @param {string} options.pagePath - Calculated route path.
 * @param {object} [options.options] - Custom options.
 * @param {object} [options.siteConfig] - Site configuration.
 * @returns {Record<string, unknown>} Final page data.
 */
export function buildPageData({
  frontmatter,
  content,
  fileName,
  pagePath,
  options = {},
  siteConfig = siteDefaults,
}) {
  if (!frontmatter || typeof frontmatter !== 'object') {
    throw new Error('Frontmatter must be a valid object.', {
      cause: new Error(`Received type: ${typeof frontmatter}`),
    })
  }

  const autoPageId =
    pagePath === '/'
      ? options.homePageId || 'home'
      : path.basename(pagePath) || fileName

  const jsonData = {
    ...deepTrimStrings(frontmatter),
    content: deepTrimStrings(content),
    path: pagePath,
    fileName,
    pageId: frontmatter.pageId || autoPageId,
  }

  return applySeoDefaults(jsonData, pagePath, siteConfig)
}

/**
 * Extracts and normalizes menu data for a specific page.
 * @param {Record<string, unknown>} frontmatter - Parsed frontmatter data.
 * @param {string} fileName - Current file name.
 * @returns {{ name: string, order: number, show: boolean }} Menu entry.
 */
export function extractMenuEntry(frontmatter, fileName) {
  const DEFAULT_ORDER = 999
  const menuMain = frontmatter.menuMain

  if (menuMain && typeof menuMain === 'object') {
    return {
      name: menuMain.name || frontmatter.title || fileName,
      order: menuMain.order ?? DEFAULT_ORDER,
      show: menuMain.show !== false,
    }
  }

  return {
    name: frontmatter.menuName || frontmatter.title || fileName,
    order: frontmatter.menuOrder ?? DEFAULT_ORDER,
    show: frontmatter.showInMenu !== false,
  }
}
