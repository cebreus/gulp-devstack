import pc from 'picocolors'

/** @type {{[key: string]: {char: string, color: function(string): string}}} */
const LOG_CONFIG = {
  error: { char: '█', color: pc.red },
  warn: { char: '█', color: pc.yellow },
  info: { char: '▒', color: pc.cyan },
  debug: { char: '░', color: pc.gray },
  verbose: { char: '░', color: pc.gray },
}

/**
 * Formats a list of items with consistent bullet-point indentation.
 * Consistent with `attachPipelineLogging` in helpers.js.
 * @param {string} header - The primary message or category
 * @param {string[]} items - List of strings to format as bullets
 * @returns {string} Formatted multi-line string
 */
export function formatList(header, items) {
  if (!items || items.length === 0) return header
  return `${header}:\n${items
    .map((item) => `            ${pc.dim('-')} ${pc.gray(item)}`)
    .join('\n')}`
}

/**
 * Internal: Formats the log prefix including status bars and labels.
 * @param {string} level - Log level key
 * @param {string} [subLabel] - Optional category or submodule label
 * @returns {string} Formatted terminal string
 * @private
 */
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

/**
 * Internal: Dispatches log messages to the console.
 * @param {string} level - Log level
 * @param {string} subLabel - Category label
 * @param {...unknown} data - Content to log
 * @private
 */
function dispatch(level, subLabel, ...data) {
  const prefix = composePrefix(level, subLabel)
  if (level === 'error') {
    console.error(prefix, ...data)
    return
  }
  console.log(prefix, ...data)
}

/**
 * Checks if debug logging is enabled (via DEBUG or VERBOSE env vars).
 * @returns {boolean} True if debug mode is active
 */
export function isDebugEnabled() {
  const envLevel = String(process.env.LOG_LEVEL || '').toLowerCase()
  return !!(
    process.env.DEBUG ||
    process.env.VERBOSE ||
    ['debug', 'verbose', 'silly'].includes(envLevel)
  )
}

/**
 * Checks if ultra-verbose logging is enabled (via VERBOSE env var).
 * @returns {boolean} True if verbose mode is active
 */
export function isVerboseEnabled() {
  const envLevel = String(process.env.LOG_LEVEL || '').toLowerCase()
  return !!(process.env.VERBOSE || ['verbose', 'silly'].includes(envLevel))
}

/**
 * System-wide logging utilities.
 * @param {...unknown} args - Content to log
 * @returns {void}
 */
export function error(...args) {
  dispatch('error', '', ...args)
}

/**
 * Logs a warning message.
 * @param {...unknown} args - Content to log
 * @returns {void}
 */
export function warn(...args) {
  dispatch('warn', '', ...args)
}

/**
 * Logs an informational message.
 * @param {...unknown} args - Content to log
 * @returns {void}
 */
export function info(...args) {
  dispatch('info', '', ...args)
}

/**
 * Logs a debug message when debug mode is enabled.
 * @param {...unknown} args - Content to log
 * @returns {void}
 */
export function debug(...args) {
  if (!isDebugEnabled()) return
  dispatch('debug', '', ...args)
}

/**
 * Logs a verbose message when ultra-verbose mode is enabled.
 * @param {...unknown} args - Content to log
 * @returns {void}
 */
export function verbose(...args) {
  if (!isVerboseEnabled()) return
  dispatch('verbose', '', ...args)
}

/**
 * Creates an isolated logger instance for a specific project submodule.
 * @param {string} categoryName - Name of the submodule (e.g. 'Sass', 'Images')
 * @returns {{
 *   error: function(...unknown): void,
 *   warn: function(...unknown): void,
 *   info: function(...unknown): void,
 *   debug: function(...unknown): void,
 *   verbose: function(...unknown): void,
 *   list: function(string, string[]): void
 * }} Logger interface
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
