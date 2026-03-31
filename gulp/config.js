import { readFileSync } from 'node:fs'

import { getEnv } from './utils/helpers.js'

/**
 * @typedef {object} BuildModeConfig
 * @property {string} version - Build version label (dev, prod, export)
 * @property {string} buildBase - Root build output directory
 * @property {Array<any>} postcssPluginsBase - Base PostCSS plugins
 * @property {boolean} minifyJs - Whether to minify JS output
 * @property {boolean} minifyCss - Whether to minify CSS output
 * @property {boolean} concatFiles - Whether to bundle JS files
 * @property {boolean} optimizeImages - Whether to run imagemin
 * @property {object} imageOptimizationConfig - Detailed image settings
 * @property {boolean} sourceMaps - Whether to generate sourcemaps
 * @property {boolean} generateFavicons - Whether to run favicon generation
 * @property {boolean} [runCriticalCss] - Whether to extract critical CSS
 * @property {object} faviconGenConfig - Shared favicon settings
 * @property {string[]} injectCdnJs - CDN scripts for HTML injection
 * @property {string[]} injectJs - Local JS patterns for injection
 * @property {string[]} injectCss - Local CSS patterns for injection
 * @property {object} [htmlBeautifyOptions] - Options for gulp-jsbeautifier in HTML task
 * @property {object} [fontLoadConfig] - Options for gulp-google-webfonts
 */

const packageData = JSON.parse(readFileSync('./package.json', 'utf8'))

// --- Core Path Constants ---
export const srcBase = './src'
export const routesBase = './src/routes'
export const staticBase = './public'
export const tempBase = '.temp'

export const htmlBeautifyOptions = {
  indent_size: 2,
  indent_char: ' ',
  max_preserve_newlines: 1,
  preserve_newlines: true,
  indent_inner_html: false,
  end_with_newline: true,
}

export const fontLoadConfigBase = {
  fontsDir: 'fonts/',
  cssDir: 'css/',
  cssFilename: 'fonts.css',
}

// --- Shared Assets Defaults ---
export const imageOptimizationConfigBase = {
  jpg: { quality: 85, mozjpeg: true, progressive: true, lqs: false },
  webp: { quality: 80 },
  avif: { quality: 50, speed: 5 },
  png: { compressionLevel: 9, palette: true },
}

export const faviconGenConfig = {
  appName: packageData.name,
  appShortName: packageData.name,
  appDescription: packageData.description,
  developerName: packageData.author,
  developerURL: packageData.homepage,
  background: '#000000',
  path: '/assets/favicons/',
  url: process.env.SITE_BASE_URL,
  display: 'standalone',
  orientation: 'portrait',
  scope: '/',
  start_url: '/index.html',
  version: packageData.version,
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

/** @type {{[key: string]: BuildModeConfig}} */
const BUILD_CONFIGS = {
  dev: {
    version: 'dev',
    buildBase: './build-dev',
    postcssPluginsBase: [],
    minifyJs: false,
    minifyCss: false,
    concatFiles: true,
    optimizeImages: false,
    imageOptimizationConfig: {
      ...imageOptimizationConfigBase,
      jpg: { ...imageOptimizationConfigBase.jpg, lqs: false },
    },
    sourceMaps: true,
    generateFavicons: false,
    runCriticalCss: false,
    formatCode: false,
    faviconGenConfig,
    fontLoadConfig: fontLoadConfigBase,
    htmlBeautifyOptions,
    injectCdnJs: [],
    injectJs: ['./build-dev/assets/js/**/*.js'],
    injectCss: ['./build-dev/assets/css/**/*.css'],
  },

  build: {
    version: 'prod',
    buildBase: './build-prod',
    postcssPluginsBase: [],
    minifyJs: true,
    minifyCss: true,
    concatFiles: true,
    optimizeImages: true,
    imageOptimizationConfig: {
      ...imageOptimizationConfigBase,
      jpg: { ...imageOptimizationConfigBase.jpg, lqs: true },
    },
    sourceMaps: false,
    generateFavicons: true,
    runCriticalCss: false,
    formatCode: false,
    faviconGenConfig,
    fontLoadConfig: fontLoadConfigBase,
    htmlBeautifyOptions,
    injectCdnJs: [],
    injectJs: ['./build-prod/assets/js/**/*.js'],
    injectCss: ['./build-prod/assets/css/**/*.css'],
  },

  export: {
    version: 'export',
    buildBase: './build-export',
    postcssPluginsBase: [],
    minifyJs: false,
    minifyCss: false,
    concatFiles: true,
    optimizeImages: true,
    imageOptimizationConfig: {
      ...imageOptimizationConfigBase,
      jpg: { ...imageOptimizationConfigBase.jpg, lqs: true },
    },
    sourceMaps: false,
    generateFavicons: true,
    runCriticalCss: false,
    faviconGenConfig,
    fontLoadConfig: fontLoadConfigBase,
    formatCode: true,
    htmlBeautifyOptions,
    injectCdnJs: [],
    injectJs: ['./build-export/assets/js/**/*.js'],
    injectCss: ['./build-export/assets/css/**/*.css'],
  },
}

const VALID_BUILD_MODES = ['dev', 'build', 'export']

/**
 * Validates provided build mode.
 * @param {string} mode - Candidate build mode
 * @returns {void}
 */
function assertBuildMode(mode) {
  if (VALID_BUILD_MODES.includes(mode)) return
  throw new Error(
    `[Config] Invalid BUILD_MODE '${mode}'. Expected one of: ${VALID_BUILD_MODES.join(', ')}`
  )
}

/**
 * Returns the currently active build mode from environment.
 * @param {object} [env] - Environment object
 * @returns {string} One of: 'dev', 'build', 'export'
 */
function getCurrentBuildMode(env = process.env) {
  const mode = env.BUILD_MODE
  if (!mode) {
    throw new Error('[Config] BUILD_MODE must be set.')
  }
  assertBuildMode(mode)
  return mode
}

/**
 * Resolves the configuration object based on active build mode.
 * @param {object} [env] - Environment object
 * @returns {BuildModeConfig} The current build mode configuration object
 */
function resolveCurrentConfig(env = process.env) {
  return BUILD_CONFIGS[getCurrentBuildMode(env)]
}

// --- Dynamic Source Mappings ---
export const sassBase = `${srcBase}/scss`
export const sassCore = `${sassBase}/bootstrap.scss`
export const sassCustom = `${sassBase}/custom.scss`
/**
 * Relative path to sass utilities.
 * @returns {string} Path to utility file
 */
export const sassUtils = `${sassBase}/utils.scss`
export const sassComponentsGlob = `${srcBase}/lib/components/**/*.scss`
export const sassRoutesGlob = `${routesBase}/**/*.scss`
export const sassWatch = [
  `${sassBase}/**/*.scss`,
  `${srcBase}/lib/components/**/*.scss`,
  `${routesBase}/**/*.scss`,
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

export const imagesJpg = `${imagesBase}/**/*.{jpg,jpeg}`
export const imagesPng = `${imagesBase}/**/*.png`
export const imagesSvg = `${imagesBase}/**/*.svg`

export const fontloadFile = `${srcBase}/config/fonts.list`
export const siteConfigFile = `${srcBase}/config/site.js`

// --- Computed Configuration Getters ---
// These ensure tasks always get the config relevant to the current BUILD_MODE.

/**
 * Returns active build version label.
 * @param {object} [env] - Environment object
 * @returns {string} Build version
 */
export function version(env = process.env) {
  return resolveCurrentConfig(env).version
}

/**
 * Returns active build output directory.
 * @param {object} [env] - Environment object
 * @returns {string} Build root path
 */
export function buildBase(env = process.env) {
  return resolveCurrentConfig(env).buildBase
}

/**
 * Returns sourcemap flag for active mode.
 * @param {object} [env] - Environment object
 * @returns {boolean} True when sourcemaps are enabled
 */
export function sourceMaps(env = process.env) {
  return resolveCurrentConfig(env).sourceMaps
}

/**
 * Returns PostCSS plugins for active mode.
 * @param {object} [env] - Environment object
 * @returns {Array<any>} PostCSS plugins
 */
export function postcssPluginsBase(env = process.env) {
  return resolveCurrentConfig(env).postcssPluginsBase
}

/**
 * Returns CDN JavaScript list for HTML injection.
 * @param {object} [env] - Environment object
 * @returns {string[]} CDN script list
 */
export function injectCdnJs(env = process.env) {
  return resolveCurrentConfig(env).injectCdnJs
}

/**
 * Resolves JS injection paths relative to selected build directory.
 * @param {object} [env] - Environment object
 * @returns {string[]} List of resolved glob patterns
 */
export function injectJs(env = process.env) {
  const config = resolveCurrentConfig(env)
  return config.injectJs.map((pattern) =>
    pattern.replace(/\.\/build(-[^/]+)?/, config.buildBase)
  )
}

/**
 * Resolves CSS injection patterns.
 * @param {object} [env] - Environment object
 * @returns {string[]} List of resolved glob patterns
 */
export function injectCss(env = process.env) {
  const config = resolveCurrentConfig(env)
  return config.injectCss.map((pattern) =>
    pattern.replace(/\.\/build(-[^/]+)?/, config.buildBase)
  )
}

/**
 * Returns whether JS should be minified.
 * @param {object} [env] - Environment object
 * @returns {boolean} JS minification flag
 */
export function minifyJs(env = process.env) {
  return resolveCurrentConfig(env).minifyJs
}

/**
 * Returns whether CSS should be minified.
 * @param {object} [env] - Environment object
 * @returns {boolean} CSS minification flag
 */
export function minifyCss(env = process.env) {
  return resolveCurrentConfig(env).minifyCss
}

/**
 * Returns whether JS files should be concatenated.
 * @param {object} [env] - Environment object
 * @returns {boolean} Concatenation flag
 */
export function concatFiles(env = process.env) {
  return resolveCurrentConfig(env).concatFiles
}

/**
 * Returns whether images should be optimized.
 * @param {object} [env] - Environment object
 * @returns {boolean} Image optimization flag
 */
export function optimizeImages(env = process.env) {
  return resolveCurrentConfig(env).optimizeImages
}

/**
 * Returns image optimization settings for active mode.
 * @param {object} [env] - Environment object
 * @returns {object} Image optimization settings
 */
export function imageOptimizationConfig(env = process.env) {
  return resolveCurrentConfig(env).imageOptimizationConfig
}

/**
 * Whether to generate favicons.
 * @param {object} [env] - Environment object
 * @returns {boolean} True if favicons should be generated
 */
export function generateFavicons(env = process.env) {
  return resolveCurrentConfig(env).generateFavicons
}

/**
 * Returns whether export mode formatting is enabled.
 * @param {object} [env] - Environment object
 * @returns {boolean} Formatting flag
 */
export function formatCode(env = process.env) {
  return resolveCurrentConfig(env).formatCode
}

/**
 * Returns HTML beautifier options for active mode.
 * @param {object} [env] - Environment object
 * @returns {object} Beautifier options
 */
export function htmlBeautifyOptionsGetter(env = process.env) {
  return resolveCurrentConfig(env).htmlBeautifyOptions
}

/**
 * Returns font loading configuration for active mode.
 * @param {object} [env] - Environment object
 * @returns {object} Font loading configuration
 */
export function fontLoadConfig(env = process.env) {
  return resolveCurrentConfig(env).fontLoadConfig
}

// --- Target Directory Getters ---
/**
 * Returns CSS build directory path.
 * @param {object} [env] - Environment object
 * @returns {string} CSS build path
 */
export function sassBuild(env = process.env) {
  return `${resolveCurrentConfig(env).buildBase}/assets/css`
}

/**
 * Returns JavaScript build directory path.
 * @param {object} [env] - Environment object
 * @returns {string} JavaScript build path
 */
export function jsBuild(env = process.env) {
  return `${resolveCurrentConfig(env).buildBase}/assets/js`
}

/**
 * Returns fonts build directory path.
 * @param {object} [env] - Environment object
 * @returns {string} Fonts build path
 */
export function fontsBuild(env = process.env) {
  return `${resolveCurrentConfig(env).buildBase}/assets/fonts`
}

/**
 * Returns icons build directory path.
 * @param {object} [env] - Environment object
 * @returns {string} Icons build path
 */
export function iconsBuild(env = process.env) {
  return `${resolveCurrentConfig(env).buildBase}/assets/icons`
}

/**
 * Returns images build directory path.
 * @param {object} [env] - Environment object
 * @returns {string} Images build path
 */
export function imagesBuild(env = process.env) {
  return `${resolveCurrentConfig(env).buildBase}/assets/images`
}

/**
 * Returns favicons build directory path.
 * @param {object} [env] - Environment object
 * @returns {string} Favicons build path
 */
export function faviconBuild(env = process.env) {
  return `${resolveCurrentConfig(env).buildBase}/assets/favicons`
}

/**
 * Returns template build root path.
 * @param {object} [env] - Environment object
 * @returns {string} Template build path
 */
export function tplBuild(env = process.env) {
  return resolveCurrentConfig(env).buildBase
}

/**
 * Retrieves the full configuration for a specific mode.
 * @param {string} mode - 'dev', 'build', or 'export'
 * @returns {BuildModeConfig} The requested build mode configuration
 */
export function getConfig(mode) {
  if (!mode) {
    throw new Error('[Config] Build mode is required.')
  }
  assertBuildMode(mode)
  return BUILD_CONFIGS[mode]
}

/**
 * Convenience method to get all build-related paths in a single object.
 * @param {object} [env] - Environment object
 * @returns {object} Map of build directory paths
 */
export function getBuildPaths(env = process.env) {
  const current = resolveCurrentConfig(env)
  return {
    buildBase: current.buildBase,
    sassBuild: `${current.buildBase}/assets/css`,
    jsBuild: `${current.buildBase}/assets/js`,
    fontsBuild: `${current.buildBase}/assets/fonts`,
    iconsBuild: `${current.buildBase}/assets/icons`,
    imagesBuild: `${current.buildBase}/assets/images`,
    faviconBuild: `${current.buildBase}/assets/favicons`,
    tplBuild: current.buildBase,
  }
}

/**
 * Get build configuration flags for given mode
 * @param {string} mode - Build mode: 'dev', 'build', or 'export'
 * @param {object} [env] - Environment object
 * @returns {object} Object containing build configuration flags
 */
export function getBuildConfig(mode, env = process.env) {
  const resolvedMode = mode || getCurrentBuildMode(env)
  const modeConfig = getConfig(resolvedMode)
  return {
    minifyJs: modeConfig.minifyJs,
    minifyCss: modeConfig.minifyCss,
    concatFiles: modeConfig.concatFiles,
    optimizeImages: modeConfig.optimizeImages,
    generateFavicons: modeConfig.generateFavicons,
    runCriticalCss: modeConfig.runCriticalCss,
    formatCode: modeConfig.formatCode,
    sourceMaps: modeConfig.sourceMaps,
    faviconGenConfig: modeConfig.faviconGenConfig,
  }
}

/**
 * Gets site base URL from environment.
 * @param {object} [env] - Environment object
 * @returns {string} The base URL for the site.
 */
export function getBaseUrl(env = process.env) {
  return getEnv('SITE_BASE_URL', undefined, env)
}
