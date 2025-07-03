import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import logger from './logger.js'

/**
 * Returns the relative path of a file or directory from the current execution context.
 * @param {string} absolutePath - The full path to resolve
 * @returns {string} The relative path
 */
export function getRelativePath(absolutePath) {
  return path.relative(process.cwd(), absolutePath)
}

/**
 * Ensures that a directory exists by creating it recursively if necessary.
 * @param {string} directoryPath - Target directory path
 * @param {object} [loggerInstance] - Optional logger for reporting creation
 * @returns {Promise<void>}
 */
export async function ensureDirectoryExists(directoryPath, loggerInstance) {
  try {
    await fs.promises.access(directoryPath)
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.promises.mkdir(directoryPath, { recursive: true })
      if (loggerInstance) {
        loggerInstance.debug(
          `Created directory: ${getRelativePath(directoryPath)}`
        )
      }
    } else {
      throw error
    }
  }
}

/**
 * Predicate to suppress specific console warnings commonly emitted by
 * legacy Bootstrap versions or @import statements in SASS.
 * @param {string} message - Warning message string
 * @returns {boolean} True if the message matches suppression criteria
 */
export function suppressOutdatedBootstrapWarnings(message) {
  const suppressedPatterns = [
    'Deprecation',
    'deprecated',
    'legacy',
    'slash as division',
  ]

  if (
    typeof message === 'string' &&
    suppressedPatterns.some((p) => message.includes(p))
  ) {
    return true
  }

  // Not internally suppressed, but we delegate original args back
  return false
}

/**
 * Normalizes a string into kebab-case (lowercase, dash-separated).
 * Removes special characters and handles leading/trailing whitespace.
 * @param {string} input - Source string
 * @returns {string} kebab-case result
 */
export function toKebabCase(input) {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Extracts a clean directory path from a glob pattern.
 * @param {string|string[]} pattern - The glob pattern
 * @returns {string} The base directory
 */
export function getDirFromGlob(pattern) {
  if (!pattern) return ''
  const base = Array.isArray(pattern) ? pattern[0] : pattern
  return base
    .replace(/\/\*\*.*$/, '')
    .replace(
      /\/[^*/]*\*[^\n\r/\u2028\u2029]*(?:[\n\r\u2028\u2029][^*/]*\*[^\n\r/\u2028\u2029]*)*(?:\/.*)?$/,
      ''
    )
}

/**
 * Checks if the provided inputs are empty and logs a warning if they are.
 * @param {any} target - Path(s), string or array to validate
 * @param {string} logMessage - Message to display if the target is considered empty
 * @returns {boolean} True if empty
 */
export function handleEmptyPaths(target, logMessage) {
  const isEmpty =
    !target ||
    (Array.isArray(target) && target.length === 0) ||
    (typeof target === 'string' && target.trim() === '')

  if (isEmpty) {
    logger.verbose(logMessage)
    return true
  }
  return false
}

/**
 * Wraps a Gulp/Node stream into a modern Promise.
 * @param {import('node:stream').Stream} stream - Node.js stream to promisify
 * @returns {Promise<import('node:stream').Stream>} Promise resolving with the stream upon completion
 */
export function streamToPromise(stream) {
  if (!stream || typeof stream.on !== 'function') {
    return Promise.resolve(stream)
  }

  return new Promise((resolve, reject) => {
    let completed = false

    const finalize = () => {
      if (!completed) {
        completed = true
        resolve(stream)
      }
    }

    const fail = (error) => {
      if (!completed) {
        completed = true
        reject(error)
      }
    }

    stream.on('end', finalize)
    stream.on('finish', finalize)
    stream.on('error', fail)
  })
}

/**
 * Attaches consistent end/error logging to a Gulp pipeline.
 * @param {object} options - Logging options
 * @param {import('node:stream').Stream} options.stream - Target stream
 * @param {object} options.loggerInstance - Logger object with verbose/error methods
 * @param {string[]} [options.trackedFiles] - List of processed files
 * @param {function(string): string} [options.formatFilePath] - Optional formatter for file output
 * @param {string} options.successLabel - Label prefix for generated assets
 * @param {string} options.emptyMessage - Message used when no files were processed
 * @param {string} options.errorMessage - Message used when stream emits error
 * @returns {import('node:stream').Stream} The same stream for chaining
 */
export function attachPipelineLogging({
  stream,
  loggerInstance,
  trackedFiles = [],
  formatFilePath,
  successLabel,
  emptyMessage,
  errorMessage,
}) {
  const format =
    typeof formatFilePath === 'function'
      ? formatFilePath
      : function (value) {
          return value
        }

  stream.on('end', () => {
    if (trackedFiles.length > 0) {
      const formattedFiles = trackedFiles.map((filePath) => format(filePath))
      loggerInstance.info(`${successLabel} [${trackedFiles.length} files]`)
      loggerInstance.list(successLabel, formattedFiles)
      return
    }

    loggerInstance.debug(emptyMessage)
  })

  stream.on('error', (error) => {
    loggerInstance.error(errorMessage, error)
  })

  return stream
}

export { getEnv } from './env.js'
