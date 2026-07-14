import { readFileSync } from 'node:fs'

import { toPosixPath } from './utils/core.js'

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))

// --- Static Path Constants ---
const srcBase = './src'
const routesBase = `${srcBase}/routes`
const staticBase = './public'
const assetsBase = `${srcBase}/assets`
const componentsPath = `${srcBase}/lib/components`
const sassBase = `${srcBase}/scss`

const SASS_ENTRYPOINTS = {
  bootstrap: `${sassBase}/bootstrap.scss`,
  custom: `${sassBase}/custom.scss`,
  components: `${sassBase}/components.scss`,
}

// --- Watch Patterns (Static Manifest) ---
const WATCH_CONFIG = {
  bootstrapWatch: [
    SASS_ENTRYPOINTS.bootstrap,
    `${sassBase}/globals.scss`,
    `${sassBase}/variables.scss`,
    `${sassBase}/variables-dark.scss`,
  ],
  projectSassWatch: [
    SASS_ENTRYPOINTS.custom,
    SASS_ENTRYPOINTS.components,
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
  templateWatchPaths: [`${srcBase}/**/*.njk`, `${srcBase}/**/*.md`],
}

// --- Tool Defaults ---
const IMAGE_OPTIMIZATION = {
  jpg: { quality: 85, mozjpeg: true, progressive: true, lqs: false },
  webp: { quality: 80 },
  avif: { quality: 50, speed: 5 },
  png: { compressionLevel: 9, palette: true },
}

const FAVICON_CONFIG = {
  appName: pkg.name,
  appShortName: pkg.name,
  appDescription: pkg.description,
  developerName: pkg.author,
  background: '#000000',
  theme_color: '#000000',
  path: '/assets/favicons/',
  display: 'standalone',
  icons: {
    android: ['android-chrome-192x192.png', 'android-chrome-512x512.png'],
    appleIcon: ['apple-touch-icon-180x180.png'],
    appleStartup: false,
    favicons: ['favicon.ico'],
    windows: false,
    yandex: false,
  },
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
 * @returns {object} Flat configuration object
 */
export function resolveConfig(mode) {
  const m = MODES[mode]
  if (!m) {
    throw new Error(`[Config] Invalid BUILD_MODE '${mode}'`, {
      cause: new Error(`Valid modes are: ${Object.keys(MODES).join(', ')}`),
    })
  }

  const buildBase = toPosixPath(process.env.GULP_OUT_DIR || m.buildBase)
  const tempBase = toPosixPath(process.env.GULP_TEMP_DIR || '.temp')
  const assetsDest = `${buildBase}/assets`

  return {
    ...m,
    ...WATCH_CONFIG,
    buildBase,
    tempBase,
    srcBase,
    routesBase,
    staticBase,
    assetsBase,
    componentsPath,
    sassBase,
    sassBootstrap: SASS_ENTRYPOINTS.bootstrap,
    sassCustom: SASS_ENTRYPOINTS.custom,
    sassComponents: SASS_ENTRYPOINTS.components,
    jsFiles: `${srcBase}/js/**/*.js`,
    imagesJpg: `${assetsBase}/images/**/*.{jpg,jpeg}`,
    imagesPng: `${assetsBase}/images/**/*.png`,
    imagesSvg: `${assetsBase}/images/**/*.svg`,
    imagesBase: `${assetsBase}/images`,
    iconsBase: `${assetsBase}/icons`,
    datasetPagesSource: `${routesBase}/**/*.md`,
    datasetPagesBuild: `${tempBase}/pages`,
    fontloadFile: `${srcBase}/config/fonts.list`,
    paths: {
      build: buildBase,
      sass: `${assetsDest}/css`,
      js: `${assetsDest}/js`,
      images: `${assetsDest}/images`,
      favicons: `${assetsDest}/favicons`,
      favicon: `${buildBase}/favicon.ico`,
      manifest: `${buildBase}/manifest.webmanifest`,
      faviconHtml: `${tempBase}/favicons/favicons.html`,
    },
    globalInjectAssets: [
      'assets/css/fonts*.css',
      'assets/css/bootstrap*.css',
      'assets/css/custom*.css',
      'assets/css/components*.css',
      'assets/js/bootstrap*.js',
      'assets/js/custom*.js',
      'assets/js/main*.js',
    ],
    imageOptimization: {
      ...IMAGE_OPTIMIZATION,
      jpg: { ...IMAGE_OPTIMIZATION.jpg, lqs: mode !== 'dev' },
    },
    faviconGen: { ...FAVICON_CONFIG, url: process.env.SITE_BASE_URL },
    htmlBeautify: {
      indent_size: 2,
      max_preserve_newlines: 1,
      end_with_newline: true,
    },
    fontLoad: { fontsDir: 'fonts/', cssDir: 'css/', cssFilename: 'fonts.css' },
    skipIntegrity: process.env.GULP_SKIP_INTEGRITY === 'true',
  }
}
