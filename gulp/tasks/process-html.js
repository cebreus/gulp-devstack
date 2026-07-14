import path from 'node:path'
import { globSync } from 'glob'
import gulp from 'gulp'

import { sortGlobalAssetPaths } from '../utils/html-output.js'
import htmlRendering from '../utils/html-rendering.js'
import loggerLib, {
  attachPipelineLogging,
  ensureFileIntegrity,
  getRelativePath,
  isPrivateFile,
  streamToPromise,
} from '../utils/index.js'
import {
  clearRouteAssetCache,
  discoverRouteScripts,
  discoverRouteStyles,
} from '../utils/navigation-assets.js'
import {
  getRouteDataArtifactsDir,
  loadPageDataArtifact,
  loadRouteArtifactsContext,
} from '../utils/route-data.js'

const logger = loggerLib.createLogger('ProcessHtml')

const SEO_PLACEHOLDERS = [
  'New Project SEO Title',
  'New Project SEO Description',
]

/**
 * Creates a transform that warns when placeholder SEO values from the
 * template defaults leak into rendered HTML. Active outside dev mode only,
 * so duplicated projects catch unedited `src/config/site.js` before deploy.
 * @param {typeof import('node:stream').Transform} TransformCtor - Stream Transform constructor.
 * @returns {import('node:stream').Transform} Object-mode transform stream.
 */
export function createPlaceholderSeoWarningTransform(TransformCtor) {
  return new TransformCtor({
    objectMode: true,
    transform(file, _enc, callback) {
      if (file.isBuffer()) {
        const html = file.contents.toString()
        const hit = SEO_PLACEHOLDERS.find((placeholder) =>
          html.includes(placeholder)
        )
        if (hit) {
          logger.warn(
            `Placeholder SEO value "${hit}" found in ${getRelativePath(file.path)}. Update src/config/site.js or page frontmatter before publishing.`
          )
        }
      }
      callback(null, file)
    },
  })
}

function createRoutesPattern(config) {
  return [
    path.join(config.routesBase, '**/*.njk').replace(/\\/g, '/'),
    `!${path.join(config.routesBase, '**/layout-*.njk').replace(/\\/g, '/')}`,
  ]
}

function createTemplatesPath(config) {
  const templatesPath = [
    config.routesBase,
    path.join(config.srcBase, 'lib'),
    config.imagesBase,
    config.iconsBase,
  ]

  if (config.paths?.faviconHtml) {
    templatesPath.push(path.dirname(config.paths.faviconHtml))
  }

  return templatesPath
}

function collectGlobalAssetPaths(config) {
  const discoveredAssetPaths = config.globalInjectAssets.flatMap(
    function collectPaths(pattern) {
      return globSync(
        path.join(config.paths.build, pattern).replace(/\\/g, '/'),
        { posix: true }
      )
    }
  )

  return sortGlobalAssetPaths(discoveredAssetPaths)
}

function createGlobalAssetsStream(config, assetPaths) {
  const pathsToRead =
    !assetPaths || assetPaths.length === 0
      ? ['__dummy_nonexistent__']
      : assetPaths

  return gulp.src(pathsToRead, {
    read: false,
    base: config.paths.build,
    allowEmpty: true,
  })
}

async function loadTemplateData(file, config, globalContext) {
  const relativePath = path.relative(config.routesBase, file.path)
  const pageRelativeDir = path.dirname(relativePath)
  const pageBasename = path.basename(relativePath, '.njk')
  const artifactsBase = getRouteDataArtifactsDir(config.tempBase)

  const [pageData, styles, scripts] = await Promise.all([
    loadPageDataArtifact({
      artifactsBase,
      routesBase: config.routesBase,
      filePath: file.path,
    }),
    discoverRouteStyles(pageRelativeDir, pageBasename, config.paths.build),
    discoverRouteScripts(pageRelativeDir, pageBasename, config.paths.build),
  ])

  return htmlRendering.buildTemplateContext({
    pageData,
    globalContext,
    config,
    pageStyles: styles,
    pageScripts: scripts,
    isPrivate: (targetPath) => isPrivateFile(targetPath),
  })
}

async function createHtmlPipeline(config, globalContext) {
  const { default: data } = await import('gulp-data')
  const { default: inject } = await import('gulp-inject')
  const { default: beautify } = await import('gulp-jsbeautifier')
  const { default: nunjucksRender } = await import('gulp-nunjucks-render')
  const { default: markdown } = await import('markdown-it')
  const { Transform } = await import('node:stream')

  const routesPattern = createRoutesPattern(config)
  const templatesPath = createTemplatesPath(config)
  const assetPaths = collectGlobalAssetPaths(config)
  const globalAssets = createGlobalAssetsStream(config, assetPaths)
  const processedFiles = []

  let pipeline = gulp
    .src(routesPattern, { allowEmpty: true })
    .pipe(data((file) => loadTemplateData(file, config, globalContext)))
    .pipe(
      nunjucksRender(
        htmlRendering.createNunjucksOptions(config, templatesPath, markdown)
      )
    )
    .pipe(
      inject(globalAssets, {
        transform: (filepath) =>
          htmlRendering.transformInjectedAsset(filepath, config.paths.build),
        addRootSlash: false,
        quiet: true,
      })
    )
    .pipe(ensureFileIntegrity({ taskName: 'Html', minSize: 50 }))

  if (config.formatCode) {
    pipeline = pipeline.pipe(beautify(config.htmlBeautify))
  }

  if (process.env.BUILD_MODE !== 'dev') {
    pipeline = pipeline.pipe(createPlaceholderSeoWarningTransform(Transform))
  }

  pipeline = pipeline
    .pipe(htmlRendering.createHtmlNormalizationTransform(Transform))
    .pipe(
      htmlRendering.createProcessedFilesTracker(
        Transform,
        processedFiles,
        getRelativePath
      )
    )
    .pipe(gulp.dest(config.paths.build))

  return { htmlPipeline: pipeline, processedFiles }
}

/**
 * Gulp Task: Renders Nunjucks templates into HTML with injected assets.
 * @param {object} config - Project configuration provider.
 * @returns {Promise<void>} Resolves when HTML generation is complete.
 */
export default async function processHtml(config) {
  clearRouteAssetCache()
  const { siteData, menuData } = await loadRouteArtifactsContext(
    config.tempBase
  )
  const globalContext = htmlRendering.buildGlobalContext({ siteData, menuData })
  const { htmlPipeline, processedFiles } = await createHtmlPipeline(
    config,
    globalContext
  )

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
