import fs from 'node:fs'
import path from 'node:path'
import { globSync } from 'glob'
import gulp from 'gulp'

import loggerLib, {
  attachPipelineLogging,
  cleanHtmlComments,
  ensureFileIntegrity,
  getRelativePath,
  isPrivateFile,
  resolveInjectionUrl,
  streamToPromise,
  stripXhtmlSlashes,
} from '../utils/index.js'

const logger = loggerLib.createLogger('ProcessHtml')

/**
 * Loads page-specific JSON data.
 * @param {import('vinyl')} file - The current Nunjucks template file
 * @param {object} config - Project configuration
 * @returns {object} Page data object
 */
function loadPageData(file, config) {
  const relativePath = path.relative(config.routesBase, file.path)
  const dataPath = path.join(
    config.tempBase,
    'pages',
    relativePath.replace('.njk', '.json')
  )

  if (!fs.existsSync(dataPath)) return {}

  try {
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'))
  } catch (error) {
    const errorMsg = `Failed to parse page data: ${file.path}`
    logger.error(`${errorMsg}. Cause: ${error.message}`)
    throw new Error(`[ProcessHtml] ${errorMsg}`, { cause: error })
  }
}

/**
 * Loads global site data (site metadata and navigation menu).
 * @param {object} config - Project configuration
 * @returns {object} Combined site data object
 */
function loadSiteData(config) {
  const siteDataPath = path.join(config.tempBase, 'site.json')
  const menuDataPath = path.join(config.tempBase, 'pages', 'menu.json')
  let siteData = {}

  if (fs.existsSync(siteDataPath)) {
    try {
      siteData = JSON.parse(fs.readFileSync(siteDataPath, 'utf8'))
    } catch (error) {
      logger.error(`Failed to parse site.json. Cause: ${error.message}`)
    }
  }

  if (fs.existsSync(menuDataPath)) {
    try {
      const menuData = JSON.parse(fs.readFileSync(menuDataPath, 'utf8'))
      siteData = { ...siteData, ...menuData }
    } catch (error) {
      logger.error(`Failed to parse menu.json. Cause: ${error.message}`)
    }
  }

  return siteData
}

/**
 * Discovers CSS and JS assets specifically named for the current route.
 * @param {import('vinyl')} file - Current template file
 * @param {object} config - Project configuration
 * @returns {{ styles: string[], scripts: string[] }} Discovered asset URLs
 */
function discoverRouteAssets(file, config) {
  const relativePath = path.relative(config.routesBase, file.path)
  const pageRelativeDir = path.dirname(relativePath)
  const pageBasename = path.basename(relativePath, '.njk')

  const styles = []
  const scripts = []

  const possibleStyles = [
    `${pageBasename}.css`,
    `${pageBasename}.min.css`,
    'index.css',
    'index.min.css',
  ]
  const possibleScripts = [`${pageBasename}.js`, 'index.js']

  for (const name of possibleStyles) {
    const p = path.join(config.paths.build, 'assets/css', pageRelativeDir, name)
    if (fs.existsSync(p)) {
      styles.push(resolveInjectionUrl(p, config.paths.build))
      break
    }
  }

  for (const name of possibleScripts) {
    const p = path.join(config.paths.build, 'assets/js', pageRelativeDir, name)
    if (fs.existsSync(p)) {
      scripts.push(resolveInjectionUrl(p, config.paths.build))
      break
    }
  }

  return { styles, scripts }
}

/**
 * Assigns a numerical priority weight to an asset for injection sorting.
 * Lower numbers appear earlier in the HTML.
 * @param {string} filepath - The path to the asset
 * @returns {number} Priority weight
 */
function getAssetWeight(filepath) {
  const name = path.basename(filepath).toLowerCase()
  const weights = {
    fonts: 5,
    bootstrap: 10,
    components: 20,
    custom: 30,
    main: 40,
    utils: 50,
    'u-devstack': 100, // Debugger layer - MUST BE ABSOLUTELY LAST
  }

  for (const [key, weight] of Object.entries(weights)) {
    if (name.includes(key)) return weight
  }

  return 100 // Default for unknown assets
}

/**
 * Gulp Task: Renders Nunjucks templates into HTML.
 * @param {object} config - Project configuration provider
 * @returns {Promise<void>} Resolves when HTML generation is complete
 */
export async function processHtml(config) {
  const { default: data } = await import('gulp-data')
  const { default: inject } = await import('gulp-inject')
  const { default: beautify } = await import('gulp-jsbeautifier')
  const { default: nunjucksRender } = await import('gulp-nunjucks-render')
  const { default: markdown } = await import('markdown-it')
  const { Transform } = await import('node:stream')

  const routesPattern = [
    path.join(config.routesBase, '**/*.njk').replace(/\\/g, '/'),
    `!${path.join(config.routesBase, '**/layout-*.njk').replace(/\\/g, '/')}`,
  ]

  const templatesPath = [
    config.routesBase,
    path.join(config.srcBase, 'lib'),
    config.imagesBase,
    config.iconsBase,
  ]

  const assetPaths = config.globalInjectAssets
    .flatMap((pattern) =>
      globSync(path.join(config.paths.build, pattern), { posix: true })
    )
    .sort((a, b) => getAssetWeight(a) - getAssetWeight(b))

  const globalAssets = gulp.src(assetPaths, {
    read: false,
    base: config.paths.build,
    allowEmpty: true,
  })

  const processedFiles = []

  const htmlPipeline = gulp
    .src(routesPattern, { allowEmpty: true })
    .pipe(
      data((file) => {
        const pageData = loadPageData(file, config)
        const siteData = loadSiteData(config)
        const routeAssets = discoverRouteAssets(file, config)

        return {
          ...pageData,
          page: pageData,
          site: siteData,
          config,
          isPrivate: (p) => isPrivateFile(p),
          pageStyles: routeAssets.styles,
          pageScripts: routeAssets.scripts,
        }
      })
    )
    .pipe(
      nunjucksRender({
        path: templatesPath,
        inheritExtension: false,
        envOptions: {
          autoescape: false,
          trimBlocks: true,
          lstripBlocks: true,
          noCache: config.version === 'dev',
        },
        manageEnv: (env) => {
          const md = markdown({ html: true })
          env.addFilter('md', (str, inline = false) => {
            if (!str) return ''
            return inline ? md.renderInline(str) : md.render(str)
          })

          env.addFilter('mdInline', (str) => {
            if (!str) return ''
            return md.renderInline(str)
          })

          env.addFilter('date', (str, format) => {
            const date = str === 'now' || !str ? new Date() : new Date(str)
            if (isNaN(date.getTime())) return new Date().getFullYear()
            return format === 'YYYY' ? date.getFullYear() : date.toISOString()
          })
        },
      })
    )
    .pipe(
      inject(globalAssets, {
        transform: (filepath) => {
          const cleanPath = resolveInjectionUrl(filepath, config.paths.build)
          if (filepath.endsWith('.css')) {
            return `<link rel="stylesheet" href="${cleanPath}">`
          }
          if (filepath.endsWith('.js')) {
            return `<script src="${cleanPath}" type="module"></script>`
          }
          return filepath
        },
        addRootSlash: false,
        quiet: true,
      })
    )
    .pipe(
      new Transform({
        objectMode: true,
        transform(file, _enc, cb) {
          const content = file.contents.toString()
          file.contents = Buffer.from(
            cleanHtmlComments(stripXhtmlSlashes(content))
          )
          cb(null, file)
        },
      })
    )
    .pipe(ensureFileIntegrity({ taskName: 'Html', minSize: 50 }))
    .pipe(beautify(config.htmlBeautify))
    .pipe(
      new Transform({
        objectMode: true,
        transform(file, _enc, cb) {
          if (file && file.path) {
            processedFiles.push(getRelativePath(file.path))
          }
          cb(null, file)
        },
      })
    )
    .pipe(gulp.dest(config.paths.build))

  attachPipelineLogging({
    stream: htmlPipeline,
    loggerInstance: logger,
    trackedFiles: processedFiles,
    successLabel: 'HTML pages generated',
    emptyMessage: 'No HTML pages were generated.',
    errorMessage: 'HTML processing failed!',
  })

  try {
    await streamToPromise(htmlPipeline)
  } catch (error) {
    throw new Error('HTML generation failed.', { cause: error })
  }
}

export default processHtml
