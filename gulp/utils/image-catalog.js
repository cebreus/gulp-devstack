import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { globSync } from 'glob'
import sharp from 'sharp'

import { getLqsPlaceholder } from './image-helpers.js'

const FORMAT_ORDER = ['avif', 'webp', 'jpg', 'jpeg', 'png']
const FALLBACK_ORDER = ['jpg', 'jpeg', 'png', 'webp', 'avif']
const FORMAT_TYPES = {
  avif: 'image/avif',
  webp: 'image/webp',
}

function publicPath(assetBaseUrl, relativePath) {
  return path.posix.join(assetBaseUrl, relativePath.replaceAll('\\', '/'))
}

function imageKey(relativePath) {
  const parsed = path.posix.parse(relativePath.replaceAll('\\', '/'))
  return path.posix.join(parsed.dir, parsed.name)
}

function placeholderClass(src) {
  const digest = createHash('sha256').update(src).digest('hex')
  return `lqs-${digest.slice(0, 10)}`
}

function fallbackFile(files) {
  return FALLBACK_ORDER.map((format) => files.get(format)).find(Boolean)
}

function pictureSources(files, assetBaseUrl) {
  return FORMAT_ORDER.filter(
    (format) => FORMAT_TYPES[format] && files.has(format)
  ).map(function buildSource(format) {
    return {
      type: FORMAT_TYPES[format],
      srcset: publicPath(assetBaseUrl, files.get(format)),
    }
  })
}

/**
 * Describes the bitmap files that were actually emitted by the image pipeline.
 * Transparent outputs keep intrinsic dimensions but deliberately receive no LQS.
 * @param {object} options - Catalog options.
 * @param {string} options.imagesDest - Built image directory.
 * @param {string} [options.assetBaseUrl] - Public image directory.
 * @returns {Promise<{catalog: Record<string, object>, css: string}>} Catalog and placeholder CSS.
 */
export async function buildLocalImageCatalog({
  imagesDest,
  assetBaseUrl = '/assets/images',
}) {
  const groups = new Map()
  const files = globSync('**/*.{jpg,jpeg,png,webp,avif}', {
    cwd: imagesDest,
    nodir: true,
    posix: true,
  }).sort()

  files.forEach(function groupOutput(relativePath) {
    const extension = path.extname(relativePath).slice(1).toLowerCase()
    const key = imageKey(relativePath)
    const group = groups.get(key) || new Map()
    group.set(extension, relativePath)
    groups.set(key, group)
  })

  const catalog = {}
  const css = []

  for (const [key, outputs] of [...groups].sort(([left], [right]) =>
    left.localeCompare(right)
  )) {
    const fallback = fallbackFile(outputs)
    const fallbackPath = path.join(imagesDest, fallback)
    const source = await fs.readFile(fallbackPath)
    const oriented = await sharp(source).rotate().toBuffer({
      resolveWithObject: true,
    })
    const metadata = await sharp(oriented.data).metadata()
    const src = publicPath(assetBaseUrl, fallback)
    const descriptor = {
      src,
      sources: pictureSources(outputs, assetBaseUrl),
      width: oriented.info.width,
      height: oriented.info.height,
    }

    if (!metadata.hasAlpha) {
      descriptor.placeholderClass = placeholderClass(src)
      const placeholder = await getLqsPlaceholder(oriented.data)
      css.push(
        `.${descriptor.placeholderClass}{background-image:url("${placeholder}");background-position:center;background-repeat:no-repeat;background-size:cover}`
      )
    }

    catalog[key] = descriptor
  }

  return { catalog, css: css.join('') }
}

/**
 * Persists catalog metadata and cacheable LQS styles.
 * @param {object} options - Output options.
 * @param {string} options.imagesDest - Built image directory.
 * @param {string} options.catalogPath - Temporary catalog path.
 * @param {string} options.cssPath - Public stylesheet path.
 * @param {string} [options.assetBaseUrl] - Public image directory.
 * @returns {Promise<void>} Resolves after both files are synchronized.
 */
export async function writeLocalImageCatalog({
  imagesDest,
  catalogPath,
  cssPath,
  assetBaseUrl,
}) {
  const assets = await buildLocalImageCatalog({ imagesDest, assetBaseUrl })
  await Promise.all([
    fs.mkdir(path.dirname(catalogPath), { recursive: true }),
    fs.mkdir(path.dirname(cssPath), { recursive: true }),
  ])
  await fs.writeFile(
    catalogPath,
    `${JSON.stringify(assets.catalog, null, 2)}\n`
  )

  if (assets.css) {
    await fs.writeFile(cssPath, `${assets.css}\n`)
  } else {
    await fs.rm(cssPath, { force: true })
  }
}

/**
 * Loads the required image catalog for template rendering.
 * @param {string} catalogPath - Generated catalog path.
 * @returns {Promise<Record<string, object>>} Image descriptors by output key.
 */
export async function loadLocalImageCatalog(catalogPath) {
  return JSON.parse(await fs.readFile(catalogPath, 'utf8'))
}

function getAttribute(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}=(['"])(.*?)\\1`, 'i'))
  return match?.[2] || ''
}

function addAttribute(tag, name, value) {
  return tag.replace(/\s*\/?>$/, function insertAttribute(closing) {
    return ` ${name}="${value}"${closing}`
  })
}

function addClass(tag, className) {
  if (!className) {
    return tag
  }
  const classes = getAttribute(tag, 'class')
  if (!classes) {
    return addAttribute(tag, 'class', className)
  }
  if (classes.split(/\s+/).includes(className)) {
    return tag
  }
  return tag.replace(/(\sclass=['"])(.*?)(['"])/i, `$1$2 ${className}$3`)
}

function addMissingDimension(tag, name, value) {
  return getAttribute(tag, name) || !value
    ? tag
    : addAttribute(tag, name, value)
}

/**
 * Enriches controlled legacy fragments when a template explicitly applies it.
 * @param {string} html - Rendered legacy HTML fragment.
 * @param {Record<string, object>} catalog - Local output descriptors.
 * @returns {string} Fragment with local LQS classes and intrinsic dimensions.
 */
export function applyLocalImageMetadata(html, catalog = {}) {
  const bySrc = new Map(
    Object.values(catalog).map((descriptor) => [descriptor.src, descriptor])
  )

  return String(html || '').replace(
    /<img\b[^>]*>/gi,
    function enhanceImage(tag) {
      const src = getAttribute(tag, 'src').split(/[?#]/, 1)[0]
      const image = bySrc.get(src)
      if (!image) {
        return tag
      }

      return addMissingDimension(
        addMissingDimension(
          addClass(tag, image.placeholderClass),
          'width',
          image.width
        ),
        'height',
        image.height
      )
    }
  )
}
