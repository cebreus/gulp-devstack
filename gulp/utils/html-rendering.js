import {
  cleanHtmlComments,
  resolveInjectionUrl,
  stripBooleanAttributeValues,
  stripTrailingLineWhitespace,
  stripXhtmlSlashes,
} from './html-output.js'
import { applyLocalImageMetadata } from './image-catalog.js'

const DEFAULT_DATE_LOCALE = 'en'
const DEFAULT_DATE_TIMEZONE = 'UTC'

function buildGlobalContext({ siteData = {}, menuData = {} } = {}) {
  return {
    ...siteData,
    ...menuData,
  }
}

function buildTemplateContext({
  pageData = {},
  globalContext = {},
  config,
  pageStyles = [],
  pageScripts = [],
  isPrivate,
}) {
  const context = {
    ...pageData,
    page: pageData,
    site: globalContext,
    config,
    pageStyles,
    pageScripts,
  }

  if (typeof isPrivate === 'function') {
    context.isPrivate = isPrivate
  }

  return context
}

function formatTemplateDate(input, format) {
  const useCurrentDate =
    input === 'now' || input === null || input === undefined || input === ''
  const date = useCurrentDate ? new Date() : new Date(input)

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid template date: ${String(input)}`)
  }

  if (format === 'YYYY') {
    return date.getUTCFullYear()
  }

  if (format && typeof format === 'object') {
    return new Intl.DateTimeFormat(DEFAULT_DATE_LOCALE, {
      timeZone: DEFAULT_DATE_TIMEZONE,
      ...format,
    }).format(date)
  }

  return date.toISOString()
}

function createNunjucksOptions(config, templatesPath, markdown) {
  return {
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
        if (!str) {
          return ''
        }
        return inline ? md.renderInline(str) : md.render(str)
      })

      env.addFilter('mdInline', (str) => {
        if (!str) {
          return ''
        }
        return md.renderInline(str)
      })

      env.addFilter('date', formatTemplateDate)
      env.addFilter('localImages', applyLocalImageMetadata)
    },
  }
}

function transformInjectedAsset(filepath, buildPath) {
  const cleanUrl = resolveInjectionUrl(filepath, buildPath)
  if (filepath.endsWith('.css')) {
    return `<link rel="stylesheet" href="${cleanUrl}">`
  }
  if (filepath.endsWith('.js')) {
    return `<script src="${cleanUrl}" type="module"></script>`
  }
  return filepath
}

function createHtmlNormalizationTransform(Transform) {
  return new Transform({
    objectMode: true,
    transform(file, _enc, cb) {
      const content = file.contents.toString()
      file.contents = Buffer.from(
        stripTrailingLineWhitespace(
          stripBooleanAttributeValues(
            cleanHtmlComments(stripXhtmlSlashes(content))
          )
        )
      )
      cb(null, file)
    },
  })
}

function createProcessedFilesTracker(
  Transform,
  processedFiles,
  getRelativePath
) {
  return new Transform({
    objectMode: true,
    transform(file, _enc, cb) {
      if (file?.path) {
        processedFiles.push(getRelativePath(file.path))
      }
      cb(null, file)
    },
  })
}

const htmlRenderingApi = {
  buildGlobalContext,
  buildTemplateContext,
  createHtmlNormalizationTransform,
  createNunjucksOptions,
  createProcessedFilesTracker,
  formatTemplateDate,
  transformInjectedAsset,
}

export default htmlRenderingApi
