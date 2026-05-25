import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))

// --- Static Path Constants ---
export const srcBase = './src'
export const routesBase = './src/routes'
export const staticBase = './public'
export const tempBase = process.env.GULP_TEMP_DIR || '.temp'
export const assetsBase = `${srcBase}/assets`
export const componentsPath = `${srcBase}/lib/components`
export const sassBase = `${srcBase}/scss`
export const sassCore = `${sassBase}/bootstrap.scss`
export const sassCustom = `${sassBase}/custom.scss`
export const sassUtils = `${sassBase}/utils.scss`
export const sassComponentsGlob = `${srcBase}/lib/components/**/*.scss`
export const sassHeader = `${componentsPath}/header/header.scss`
export const sassHero = `${componentsPath}/hero/hero.scss`
export const bootstrapCssSource =
  './node_modules/bootstrap/dist/css/bootstrap.css'
export const bootstrapCssMin =
  './node_modules/bootstrap/dist/css/bootstrap.min.css'

// --- Shared Assets Defaults ---
const imageOptimizationBase = {
  jpg: { quality: 85, mozjpeg: true, progressive: true, lqs: false },
  webp: { quality: 80 },
  avif: { quality: 50, speed: 5 },
  png: { compressionLevel: 9, palette: true },
}

const faviconGenConfig = {
  appName: pkg.name,
  appShortName: pkg.name,
  appDescription: pkg.description,
  developerName: pkg.author,
  background: '#000000',
  path: '/assets/favicons/',
  display: 'standalone',
  icons: { android: true, appleIcon: true, windows: true, favicons: true },
}

// --- Mode Specific Settings ---
const MODES = {
  dev: {
    version: 'dev',
    buildBase: './build-dev',
    minifyJs: false,
    minifyCss: false,
    concatFiles: true,
    optimizeImages: false,
    sourceMaps: true,
    generateFavicons: false,
  },
  build: {
    version: 'prod',
    buildBase: './build-prod',
    minifyJs: true,
    minifyCss: true,
    concatFiles: true,
    optimizeImages: true,
    sourceMaps: false,
    generateFavicons: true,
  },
  export: {
    version: 'export',
    buildBase: './build-export',
    minifyJs: false,
    minifyCss: false,
    concatFiles: true,
    optimizeImages: true,
    sourceMaps: false,
    generateFavicons: true,
    formatCode: true,
  },
}

/**
 * Validates and resolves full configuration for a given mode.
 * @param {'dev'|'build'|'export'} mode - The build mode to use
 * @returns {{
 *   version: string,
 *   buildBase: string,
 *   minifyJs: boolean,
 *   minifyCss: boolean,
 *   concatFiles: boolean,
 *   optimizeImages: boolean,
 *   sourceMaps: boolean,
 *   generateFavicons: boolean,
 *   formatCode?: boolean,
 *   srcBase: string,
 *   routesBase: string,
 *   staticBase: string,
 *   tempBase: string,
 *   assetsBase: string,
 *   componentsPath: string,
 *   sassBase: string,
 *   sassCore: string,
 *   sassCustom: string,
 *   sassUtils: string,
 *   sassComponentsGlob: string,
 *   sassHero: string,
 *   bootstrapCssSource: string,
 *   bootstrapCssMin: string,
 *   sassWatch: string[],
 *   jsFiles: string,
 *   imagesJpg: string,
 *   imagesPng: string,
 *   imagesSvg: string,
 *   imagesBase: string,
 *   iconsBase: string,
 *   siteConfigFile: string,
 *   datasetPagesSource: string,
 *   datasetPagesBuild: string,
 *   fontloadFile: string,
 *   templateWatchPaths: string[],
 *   paths: {
 *     build: string,
 *     sass: string,
 *     js: string,
 *     fonts: string,
 *     icons: string,
 *     images: string,
 *     favicons: string
 *   },
 *   imageOptimization: {
 *     jpg: { quality: number, mozjpeg: boolean, progressive: boolean, lqs: boolean },
 *     webp: { quality: number },
 *     avif: { quality: number, speed: number },
 *     png: { compressionLevel: number, palette: boolean }
 *   },
 *   faviconGen: {
 *     appName: string,
 *     appShortName: string,
 *     appDescription: string,
 *     developerName: string,
 *     background: string,
 *     path: string,
 *     display: string,
 *     icons: { android: boolean, appleIcon: boolean, windows: boolean, favicons: boolean },
 *     url: string|undefined
 *   },
 *   htmlBeautify: {
 *     indent_size: number,
 *     max_preserve_newlines: number,
 *     end_with_newline: boolean
 *   },
 *   fontLoad: { fontsDir: string, cssDir: string, cssFilename: string },
 *   baseUrl: string|undefined
 * }} Flat configuration object
 */
export function resolveConfig(mode) {
  const m = MODES[mode]
  if (!m) {
    throw new Error(`[Config] Invalid BUILD_MODE '${mode}'`, {
      cause: new Error(`Valid modes are: ${Object.keys(MODES).join(', ')}`),
    })
  }

  const buildBase = process.env.GULP_OUT_DIR || m.buildBase
  const assetsDest = `${buildBase}/assets`

  return {
    ...m,
    // Static paths
    srcBase,
    routesBase,
    staticBase,
    tempBase,
    assetsBase,
    componentsPath,
    // SCSS specifics
    sassBase,
    sassCore,
    sassCustom,
    sassUtils,
    sassComponentsGlob,
    sassHeader,
    sassHero,
    bootstrapCssSource,
    bootstrapCssMin,
    sassWatch: [
      `${sassBase}/**/*.scss`,
      `${componentsPath}/**/*.scss`,
      `${routesBase}/**/*.scss`,
    ],
    // JS specifics
    jsFiles: `${srcBase}/js/**/*.js`,
    // Images
    imagesJpg: `${assetsBase}/images/**/*.{jpg,jpeg}`,
    imagesPng: `${assetsBase}/images/**/*.png`,
    imagesSvg: `${assetsBase}/images/**/*.svg`,
    imagesBase: `${assetsBase}/images`,
    iconsBase: `${assetsBase}/icons`,
    // Data/Templates
    siteConfigFile: `${srcBase}/config/site.js`,
    datasetPagesSource: `${routesBase}/**/*.md`,
    datasetPagesBuild: `${tempBase}/pages`,
    fontloadFile: `${srcBase}/config/fonts.list`,
    templateWatchPaths: [`${srcBase}/**/*.njk`, `${srcBase}/**/*.md`],
    // Computed Paths
    paths: {
      build: buildBase,
      sass: `${assetsDest}/css`,
      js: `${assetsDest}/js`,
      fonts: `${assetsDest}/fonts`,
      icons: `${assetsDest}/icons`,
      images: `${assetsDest}/images`,
      favicons: `${assetsDest}/favicons`,
    },
    // Global System Layers (Order is handled by getAssetWeight in process-html.js)
    globalInjectAssets: [
      'assets/css/fonts*.css',
      'assets/css/bootstrap*.css',
      'assets/css/custom*.css',
      'assets/css/header*.css',
      'assets/css/hero*.css',
      'assets/js/bootstrap*.js',
      'assets/js/custom*.js',
      'assets/js/main*.js',
    ],
    // Tools config
    imageOptimization: {
      ...imageOptimizationBase,
      jpg: { ...imageOptimizationBase.jpg, lqs: mode !== 'dev' },
    },
    faviconGen: { ...faviconGenConfig, url: process.env.SITE_BASE_URL },
    htmlBeautify: {
      indent_size: 2,
      max_preserve_newlines: 1,
      end_with_newline: true,
    },
    fontLoad: { fontsDir: 'fonts/', cssDir: 'css/', cssFilename: 'fonts.css' },
    // Globals
    baseUrl: process.env.SITE_BASE_URL,
    skipIntegrity: process.env.GULP_SKIP_INTEGRITY === 'true',
  }
}

// Backward compatibility helper for legacy tasks not yet refactored
export const getConfig = resolveConfig
