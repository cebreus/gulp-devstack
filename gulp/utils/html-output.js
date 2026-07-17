import path from 'node:path'

const GLOBAL_ASSET_PRIORITY = {
  fonts: 5,
  bootstrap: 10,
  components: 20,
  custom: 30,
  main: 40,
  utils: 50,
  'u-devstack': 100,
}

/**
 * Builds URL path used for injected CSS/JS tags.
 * @param {string} filepath - Asset file path.
 * @param {string} buildOutputPath - Build output directory path.
 * @returns {string} Public URL path.
 */
export function resolveInjectionUrl(filepath, buildOutputPath) {
  const buildRoot = path.resolve(buildOutputPath)
  const absoluteAssetPath = path.resolve(filepath)
  const relativeToBuild = path.relative(buildRoot, absoluteAssetPath)
  if (
    relativeToBuild === '..' ||
    relativeToBuild.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeToBuild)
  ) {
    throw new Error(`Asset is outside the build output: ${filepath}`)
  }
  const urlPath = `/${relativeToBuild.replace(/\\/g, '/')}`
  return urlPath.replace(/\/+/g, '/')
}

/**
 * Strips XHTML-style self-closing slashes from HTML5 void elements only.
 * @param {string} html - Input HTML string.
 * @returns {string} Cleaned HTML string.
 */
export function stripXhtmlSlashes(html) {
  const voids =
    'area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr'
  const pattern = new RegExp(`<(${voids})\\b([^>]*)/>`, 'gi')
  const closingPattern = new RegExp(`</(?:${voids})>`, 'gi')
  return html
    .replace(pattern, function replaceVoidTags(_, tag, attrs) {
      return `<${tag}${attrs.trimEnd()}>`
    })
    .replace(closingPattern, '')
}

/**
 * Removes explicit empty values from HTML boolean attributes.
 * @param {string} html - Input HTML string.
 * @returns {string} HTML with boolean attributes written without values.
 */
export function stripBooleanAttributeValues(html) {
  const attributes = [
    'allowfullscreen',
    'async',
    'autofocus',
    'checked',
    'defer',
    'disabled',
    'hidden',
    'itemscope',
    'multiple',
    'muted',
    'readonly',
    'required',
    'selected',
  ].join('|')
  const pattern = new RegExp(`\\s(${attributes})=""`, 'gi')

  return html.replace(pattern, ' $1')
}

function findProtectedCommentRanges(html) {
  const ranges = []
  const tagPattern = /<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi
  let match

  while ((match = tagPattern.exec(html)) !== null) {
    ranges.push({ start: match.index, end: tagPattern.lastIndex })
  }

  return ranges
}

function isInsideRange(offset, ranges) {
  return ranges.some(function containsOffset(range) {
    return offset > range.start && offset < range.end
  })
}

/**
 * Clears HTML comments except IE conditionals and script/style content.
 * @param {string} html - Input HTML string.
 * @returns {string} Cleaned HTML string.
 */
export function cleanHtmlComments(html) {
  const protectedRanges = findProtectedCommentRanges(html)

  return html.replace(
    /<!--(?!\s*\[if|\s*<!|\s*\])[\s\S]*?-->/g,
    function preserveProtectedComments(match, offset) {
      return isInsideRange(offset, protectedRanges) ? match : ''
    }
  )
}

/**
 * Removes trailing whitespace from every HTML line while preserving line order.
 * @param {string} html - Input HTML string.
 * @returns {string} HTML without trailing line whitespace.
 */
export function stripTrailingLineWhitespace(html) {
  return html
    .split('\n')
    .map(function trimLineEnd(line) {
      return line.replace(/[ \t]+$/u, '')
    })
    .join('\n')
}

function getGlobalAssetPriority(filepath) {
  const name = path.basename(filepath).toLowerCase()

  for (const [key, priority] of Object.entries(GLOBAL_ASSET_PRIORITY)) {
    if (name.includes(key)) {
      return priority
    }
  }

  return 100
}

/**
 * Sorts discovered global asset paths by explicit build priority.
 * @param {string[]} assetPaths - Asset file paths discovered in the build output.
 * @returns {string[]} Sorted asset paths.
 */
export function sortGlobalAssetPaths(assetPaths) {
  return [...assetPaths].sort(function compareAssetPriority(left, right) {
    return getGlobalAssetPriority(left) - getGlobalAssetPriority(right)
  })
}
