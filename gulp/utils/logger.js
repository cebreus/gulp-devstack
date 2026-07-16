import pc from 'picocolors'

const LOG_CONFIG = {
  error: { char: '█', color: pc.red },
  warn: { char: '█', color: pc.yellow },
  info: { char: '▒', color: pc.cyan },
  debug: { char: '░', color: pc.gray },
  verbose: { char: '░', color: pc.gray },
}

function formatList(header, items) {
  if (!items || items.length === 0) {
    return header
  }
  return `${header}:\n${items
    .map((item) => `            ${pc.dim('-')} ${pc.gray(item)}`)
    .join('\n')}`
}

function composePrefix(level, subLabel = '') {
  const levelConfig = LOG_CONFIG[level] || LOG_CONFIG.info
  const uppercaseLabel = level.toUpperCase()

  const levelTag = `[${uppercaseLabel}]`
  // Create consistent padding for tags
  const barLength = Math.max(0, 9 - levelTag.length)
  const separatorBars = levelConfig.char.repeat(barLength)

  const basePrefix = levelConfig.color(
    `${levelConfig.char} ${levelTag} ${separatorBars}`
  )
  const categoryIndicator = subLabel ? ` ${pc.bold(`[${subLabel}]`)}` : ''

  return `${basePrefix}${categoryIndicator}`
}

function dispatch(level, subLabel, ...data) {
  const prefix = composePrefix(level, subLabel)
  if (level === 'error') {
    console.error(prefix, ...data)
    return
  }
  if (level === 'warn') {
    console.warn(prefix, ...data)
    return
  }
  console.log(prefix, ...data)
}

function isEnabledFlag(value) {
  return ['1', 'true', 'yes', 'on', 'enabled'].includes(
    String(value || '')
      .trim()
      .toLowerCase()
  )
}

function isDebugEnabled() {
  const envLevel = String(process.env.LOG_LEVEL || '').toLowerCase()
  return Boolean(
    isEnabledFlag(process.env.DEBUG) ||
    isEnabledFlag(process.env.VERBOSE) ||
    ['debug', 'verbose', 'silly'].includes(envLevel)
  )
}

function isVerboseEnabled() {
  const envLevel = String(process.env.LOG_LEVEL || '').toLowerCase()
  return (
    isEnabledFlag(process.env.VERBOSE) ||
    ['verbose', 'silly'].includes(envLevel)
  )
}

function error(...args) {
  dispatch('error', '', ...args)
}

function warn(...args) {
  dispatch('warn', '', ...args)
}

function info(...args) {
  dispatch('info', '', ...args)
}

function debug(...args) {
  if (!isDebugEnabled()) {
    return
  }
  dispatch('debug', '', ...args)
}

function verbose(...args) {
  if (!isVerboseEnabled()) {
    return
  }
  dispatch('verbose', '', ...args)
}

/**
 * Creates a category-scoped logger.
 * @param {string} categoryName - Category shown in log prefixes.
 * @returns {object} Logger API.
 */
export function createLogger(categoryName) {
  return {
    error: (...args) => dispatch('error', categoryName, ...args),
    warn: (...args) => dispatch('warn', categoryName, ...args),
    info: (...args) => dispatch('info', categoryName, ...args),
    debug: (...args) =>
      isDebugEnabled() && dispatch('debug', categoryName, ...args),
    verbose: (...args) =>
      isVerboseEnabled() && dispatch('verbose', categoryName, ...args),
    list: (header, items) =>
      isDebugEnabled() &&
      dispatch('debug', categoryName, formatList(header, items)),
  }
}

export default {
  error,
  warn,
  info,
  debug,
  verbose,
  formatList,
  createLogger,
  isDebugEnabled,
  isVerboseEnabled,
}
