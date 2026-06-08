import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))

// --- Static Path Constants ---
const srcBase = './src'
const routesBase = './src/routes'
const staticBase = './public'
const tempBase = process.env.GULP_TEMP_DIR || '.temp'
const assetsBase = `${srcBase}/assets`
const componentsPath = `${srcBase}/lib/components`
const sassBase = `${srcBase}/scss`
const sassBootstrap = `${sassBase}/bootstrap.scss`
const sassCustom = `${sassBase}/custom.scss`
const sassComponents = `${sassBase}/components.scss`

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
  },
  build: {
    version: 'prod',
    buildBase: './build-prod',
    minifyJs: true,
    minifyCss: true,
    concatFiles: true,
    optimizeImages: true,
    sourceMaps: false,
  },
  export: {
    version: 'export',
    buildBase: './build-export',
    minifyJs: false,
    minifyCss: false,
    concatFiles: true,
    optimizeImages: true,
    sourceMaps: false,
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
 *   formatCode?: boolean,
 *   srcBase: string,
 *   routesBase: string,
 *   staticBase: string,
 *   tempBase: string,
 *   assetsBase: string,
 *   componentsPath: string,
 *   sassBase: string,
 *   sassBootstrap: string,
 *   sassCustom: string,
 *   sassComponents: string,
 *   bootstrapWatch: string[],
 *   projectSassWatch: string[],
 *   routeSassWatch: string[],
 *   routeJsWatch: string[],
 *   jsFiles: string,
 *   imagesJpg: string,
 *   imagesPng: string,
 *   imagesSvg: string,
 *   imagesBase: string,
 *   iconsBase: string,
 *   datasetPagesSource: string,
 *   datasetPagesBuild: string,
 *   fontloadFile: string,
 *   templateWatchPaths: string[],
 *   paths: {
 *     build: string,
 *     sass: string,
 *     js: string,
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
 *   fontLoad: { fontsDir: string, cssDir: string, cssFilename: string }
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
    sassBootstrap,
    sassCustom,
    sassComponents,
    bootstrapWatch: [
      sassBootstrap,
      `${sassBase}/globals.scss`,
      `${sassBase}/variables.scss`,
      `${sassBase}/variables-dark.scss`,
    ],
    projectSassWatch: [
      sassCustom,
      sassComponents,
      `${componentsPath}/**/*.scss`,
      `${sassBase}/globals.scss`,
      `${sassBase}/variables.scss`,
      `${sassBase}/variables-dark.scss`,
    ],
    routeSassWatch: [
      `${routesBase}/**/*.scss`,
      `${sassBase}/_route-abstracts.scss`,
    ],
    routeJsWatch: [`${routesBase}/**/*.js`],
    // JS specifics
    jsFiles: `${srcBase}/js/**/*.js`,
    // Images
    imagesJpg: `${assetsBase}/images/**/*.{jpg,jpeg}`,
    imagesPng: `${assetsBase}/images/**/*.png`,
    imagesSvg: `${assetsBase}/images/**/*.svg`,
    imagesBase: `${assetsBase}/images`,
    iconsBase: `${assetsBase}/icons`,
    // Data/Templates
    datasetPagesSource: `${routesBase}/**/*.md`,
    datasetPagesBuild: `${tempBase}/pages`,
    fontloadFile: `${srcBase}/config/fonts.list`,
    templateWatchPaths: [`${srcBase}/**/*.njk`, `${srcBase}/**/*.md`],
    // Computed Paths
    paths: {
      build: buildBase,
      sass: `${assetsDest}/css`,
      js: `${assetsDest}/js`,
      images: `${assetsDest}/images`,
      favicons: `${assetsDest}/favicons`,
    },
    // Global System Layers (Order is handled by getAssetWeight in process-html.js)
    globalInjectAssets: [
      'assets/css/fonts*.css',
      'assets/css/bootstrap*.css',
      'assets/css/custom*.css',
      'assets/css/components*.css',
      'assets/js/bootstrap*.js',
      'assets/js/custom*.js',
      'assets/js/main*.js',
    ],
    // Tools config
    // `sourceMaps` enables development sourcemaps for JS and Sass.
    // Production and export builds keep source maps disabled.
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
    skipIntegrity: process.env.GULP_SKIP_INTEGRITY === 'true',
  }
}
