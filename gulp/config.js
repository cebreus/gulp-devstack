import { getEnv } from './utils/env.js'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))

// Static base paths for the project.
export const srcBase = './src'
export const routesBase = './src/routes'
export const staticBase = './static'

export const tempBase = '.temp'

// Shared favicon configuration for all build modes.
export const faviconGenConfig = {
  appName: pkg.name,
  appShortName: pkg.name,
  appDescription: pkg.description || undefined,
  developerName: pkg.author || undefined,
  developerURL: pkg.homepage || undefined,
  background: '#000000',
  path: '/assets/favicons/',
  url: getBaseUrl(),
  display: 'standalone',
  orientation: 'portrait',
  scope: '/',
  start_url: '/index.html',
  version: pkg.version,
  logging: false,
  html: 'favicons.njk',
  pipeHTML: true,
  replace: false,
  icons: {
    android: true,
    appleIcon: true,
    appleStartup: false,
    coast: false,
    favicons: true,
    firefox: false,
    windows: true,
    yandex: false,
  },
}

// Base configurations for different build modes (dev, build, export).
const configs = {
  dev: {
    version: 'dev',
    buildBase: './build-dev',
    postcssPluginsBase: [],
    minifyJs: false,
    minifyCss: false,
    concatFiles: false,
    optimizeImages: false,
    sourceMaps: true,
    generateFavicons: false,
    faviconGenConfig,
    injectCdnJs: [],
    injectJs: [`./build-dev/js/**/*.js`],
    injectCss: [`./build-dev/css/**/*.css`],
  },

  build: {
    version: 'prod',
    buildBase: './build-prod',
    postcssPluginsBase: [],
    minifyJs: true,
    minifyCss: true,
    concatFiles: true,
    optimizeImages: true,
    sourceMaps: false,
    generateFavicons: true,
    faviconGenConfig,
    injectCdnJs: [],
    injectJs: [`./build-prod/js/**/*.js`],
    injectCss: [`./build-prod/css/**/*.css`],
  },

  export: {
    version: 'export',
    buildBase: './build-export',
    postcssPluginsBase: [],
    minifyJs: false,
    minifyCss: false,
    concatFiles: false,
    optimizeImages: true,
    sourceMaps: false,
    generateFavicons: true,
    faviconGenConfig,
    formatCode: true,
    injectCdnJs: [],
    injectJs: [],
    injectCss: [],
  },
}

/**
 * Get the current build mode from environment or default to 'dev'.
 * @returns {string} Build mode: 'dev', 'build', or 'export'
 */
function getCurrentBuildMode() {
  return process.env.BUILD_MODE || 'dev'
}

/**
 * Get the current configuration object for the active build mode.
 * @returns {object} Configuration object for the current build mode
 */
function getCurrentConfig() {
  const buildMode = getCurrentBuildMode()
  return configs[buildMode] || configs.dev
}

// Static source paths for various assets.
export const sassBase = `${srcBase}/scss`
export const sassCore = `${sassBase}/bootstrap.scss`
export const sassCustom = `${sassBase}/custom.scss`
export const sassUtils = `${sassBase}/utils.scss`
export const sassComponentsGlob = `${srcBase}/lib/components/**/*.scss`
export const sassWatch = [
  `${sassBase}/**/*.scss`,
  `${srcBase}/lib/components/**/*.scss`,
]

export const jsBase = `${srcBase}/js`
export const jsFiles = `${jsBase}/**/*.js`

export const contentBase = routesBase
export const datasetPagesSource = `${routesBase}/**/*.md`
export const datasetPagesBuild = `${tempBase}/pages`

export const tplPagesBase = routesBase
export const tplTemplatesBase = `${srcBase}/lib`
export const tplExtension = '.njk'

export const templatesBase = `${srcBase}/lib`
export const componentsPath = `${srcBase}/lib/components`

export const templateWatchPaths = [
  `${componentsPath}/**/*.*`,
  `${routesBase}/**/*.*`,
]

export const assetsBase = `${srcBase}/assets`
export const fontsBase = `${assetsBase}/fonts`
export const iconsBase = `${assetsBase}/icons`
export const imagesBase = `${assetsBase}/images`

// Image source patterns for different image types.
export const imagesJpg = `${imagesBase}/**/*.{jpg,jpeg}`
export const imagesPng = `${imagesBase}/**/*.png`
export const imagesSvg = `${imagesBase}/**/*.svg`

// Font configuration file path.
export const fontloadFile = `${srcBase}/config/fonts.list`

// Site configuration file path.
export const siteConfigFile = `${srcBase}/config/site.js`

// Dynamic exports using getters to ensure the current build mode's configuration is always used.
export const version = () => getCurrentConfig().version
export const buildBase = () => getCurrentConfig().buildBase
export const sourceMaps = () => getCurrentConfig().sourceMaps
export const postcssPluginsBase = () => getCurrentConfig().postcssPluginsBase
export const injectCdnJs = () => getCurrentConfig().injectCdnJs
export const injectJs = () =>
  getCurrentConfig().injectJs.map((path) =>
    path.replace(/\.\/build(-[^/]+)?/, getCurrentConfig().buildBase)
  )
export const injectCss = () =>
  getCurrentConfig().injectCss.map((path) =>
    path.replace(/\.\/build(-[^/]+)?/, getCurrentConfig().buildBase)
  )

export const minifyJs = () => getCurrentConfig().minifyJs || false
export const minifyCss = () => getCurrentConfig().minifyCss || false
export const concatFiles = () => getCurrentConfig().concatFiles || false
export const optimizeImages = () => getCurrentConfig().optimizeImages || false
export const generateFavicons = () =>
  getCurrentConfig().generateFavicons || false
export const formatCode = () => getCurrentConfig().formatCode || false

// Dynamic build paths that depend on the current build mode.
export const sassBuild = () => `${getCurrentConfig().buildBase}/css`
export const jsBuild = () => `${getCurrentConfig().buildBase}/js`
export const fontsBuild = () => `${getCurrentConfig().buildBase}/assets/fonts`
export const iconsBuild = () => `${getCurrentConfig().buildBase}/assets/icons`
export const imagesBuild = () => `${getCurrentConfig().buildBase}/assets/images`
export const faviconBuild = () =>
  `${getCurrentConfig().buildBase}/assets/favicons`
export const tplBuild = () => getCurrentConfig().buildBase

export const fontLoadConfig = () => ({
  fontsDir: fontsBase,
  outputDir: `${getCurrentConfig().buildBase}/assets/fonts`,
})

/**
 * Get configuration for specific build mode
 * @param {string} mode - Build mode: 'dev', 'build', or 'export'
 * @returns {object} Configuration object for the specified mode
 */
export function getConfig(mode = 'dev') {
  return configs[mode] || configs.dev
}

/**
 * Get build-specific paths for given mode
 * @param {string} mode - Build mode: 'dev', 'build', or 'export'
 * @returns {object} Object containing build-specific paths
 */
export function getBuildPaths(mode = getCurrentBuildMode()) {
  const config = getConfig(mode)
  return {
    buildBase: config.buildBase,
    sassBuild: `${config.buildBase}/css`,
    jsBuild: `${config.buildBase}/js`,
    fontsBuild: `${config.buildBase}/assets/fonts`,
    iconsBuild: `${config.buildBase}/assets/icons`,
    imagesBuild: `${config.buildBase}/assets/images`,
    faviconBuild: `${config.buildBase}/assets/favicons`,
    tplBuild: config.buildBase,
  }
}

/**
 * Get build configuration flags for given mode
 * @param {string} mode - Build mode: 'dev', 'build', or 'export'
 * @returns {object} Object containing build configuration flags
 */
export function getBuildConfig(mode = getCurrentBuildMode()) {
  const config = getConfig(mode)
  return {
    minifyJs: config.minifyJs || false,
    minifyCss: config.minifyCss || false,
    concatFiles: config.concatFiles || false,
    optimizeImages: config.optimizeImages || false,
    generateFavicons: config.generateFavicons || false,
    formatCode: config.formatCode || false,
    sourceMaps: config.sourceMaps,
    faviconGenConfig: config.faviconGenConfig,
  }
}

/**
 * Get the site base URL from environment or fallback to default.
 * @returns {string} The base URL for the site.
 */
export function getBaseUrl() {
  return getEnv('SITE_BASE_URL', undefined)
}
