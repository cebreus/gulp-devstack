import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { Transform } from 'node:stream'
import { finished } from 'node:stream/promises'

import logger from './logger.js'

const MAX_TRACKED_LOGS = 100

/**
 * Gulp Transform: Validates file integrity during the pipeline.
 * Throws an error if a file is empty or corrupted, preventing silent build failures.
 * @param {object} [options] - Integrity options
 * @param {number} [options.minSize] - Minimum allowed file size in bytes
 * @param {string} [options.taskName] - Name of the task for logging
 * @param {boolean} [options.skipIntegrity] - Whether to bypass the check
 * @returns {import('node:stream').Transform} A Gulp-compatible transform stream
 */
export function ensureFileIntegrity({
  minSize = 1,
  taskName = 'Unknown',
  skipIntegrity = false,
} = {}) {
  return new Transform({
    objectMode: true,
    transform(file, _enc, cb) {
      if (skipIntegrity || file.isNull()) {
        return cb(null, file)
      }
      if (file.isStream()) {
        return cb(
          new Error(`[${taskName}] Streaming is not supported. Use buffers.`)
        )
      }

      const size = file.contents.length
      if (size < minSize) {
        const fileName = file.path ? path.basename(file.path) : 'unnamed file'
        return cb(
          new Error(
            `[${taskName}] Integrity check failed: ${fileName} is empty (${size} bytes).`
          )
        )
      }

      cb(null, file)
    },
  })
}

/**
 * Environment Variable Utility.
 * Retrieves a value from an environment object with type-safe conversion.
 * @param {string} key - The environment variable name
 * @param {string|number|boolean|null|undefined} [fallback] - Value to return if the key is undefined
 * @param {Record<string, string|undefined>} [env] - The environment object to read from
 * @returns {string|boolean|number|string|number|boolean|null|undefined} The processed value
 */
export function getEnv(key, fallback, env = process.env) {
  const rawValue = env[key]
  if (rawValue === undefined) {
    return fallback
  }
  const value = String(rawValue)
  const lower = value.toLowerCase()
  if (lower === 'true') {
    return true
  }
  if (lower === 'false') {
    return false
  }
  if (!isNaN(Number(value)) && value.trim() !== '') {
    return Number(value)
  }
  return rawValue
}

/**
 * Converts common environment flag values to boolean.
 * @param {unknown} value - Raw environment variable value
 * @returns {boolean} True for enabled-like values
 */
export function toBooleanFlag(value) {
  if (typeof value === 'boolean') {
    return value
  }
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
  return ['1', 'true', 'yes', 'on', 'enabled'].includes(normalized)
}

/**
 * Returns the relative path of a file or directory from the current execution context.
 * @param {string} absolutePath - The full path to resolve
 * @returns {string} The relative path
 */
export function getRelativePath(absolutePath) {
  return path.relative(process.cwd(), absolutePath)
}

/**
 * Ensures that directories exist by creating them recursively if necessary.
 * @param {string|string[]} targetPath - Target directory path or array of paths
 * @param {object} [loggerInstance] - Optional logger for reporting creation
 * @param {function(string): void} loggerInstance.debug - Debug logging function
 * @returns {Promise<void>}
 */
export async function ensureDirectoryExists(targetPath, loggerInstance) {
  if (Array.isArray(targetPath)) {
    await Promise.all(
      targetPath.map((p) => ensureDirectoryExists(p, loggerInstance))
    )
    return
  }

  await fs.promises.mkdir(targetPath, { recursive: true })
  if (loggerInstance) {
    loggerInstance.debug(`Ensured directory: ${getRelativePath(targetPath)}`)
  }
}

/**
 * Determines if a file path points to a "private" file or directory.
 * @param {string} filePath - Path to evaluate
 * @returns {boolean} True if the file or any parent directory in its path is private
 */
export function isPrivateFile(filePath) {
  if (!filePath) {
    return false
  }
  const segments = filePath.split(/[/\\]/)
  return segments.some((segment) => segment.startsWith('_'))
}

/**
 * Normalizes a string into kebab-case (lowercase, dash-separated).
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
  if (!pattern || pattern.length === 0) {
    return ''
  }

  const base = Array.isArray(pattern) ? pattern[0] : pattern
  const firstStarIndex = base.indexOf('*')

  if (firstStarIndex === -1) {
    return path.dirname(base)
  }

  const sub = base.substring(0, firstStarIndex)
  const lastSlash = sub.lastIndexOf('/')
  return sub.substring(0, lastSlash + 1)
}

/**
 * Checks if the provided inputs are empty and logs a warning if they are.
 * @param {string|string[]|null|undefined} target - Path(s), string or array to validate
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
 * Wraps a Gulp/Node stream into a modern Promise using native Node.js finished().
 * Ensures that if a stream hangs or fails, it is properly closed.
 * @param {import('node:stream').Stream} stream - Node.js stream to promisify
 * @returns {Promise<import('node:stream').Stream>} Promise resolving with the stream upon completion
 */
export async function streamToPromise(stream) {
  if (!stream || typeof stream.on !== 'function') {
    return stream
  }

  if (typeof stream.resume === 'function') {
    stream.resume()
  }

  try {
    await finished(stream)
  } catch (err) {
    if (typeof stream.destroy === 'function') {
      stream.destroy()
    }
    throw err
  }

  return stream
}

/**
 * Attaches consistent end/error logging to a Gulp pipeline.
 * Forces stream destruction on error to prevent hangs.
 * @param {object} options - Logging options
 * @param {import('node:stream').Stream} options.stream - Target stream
 * @param {{info: function(string, ...unknown): void, list: function(string, string[]): void, debug: function(string): void, error: function(string, ...unknown): void}} options.loggerInstance - Logger object
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
  formatFilePath = (p) => p,
  successLabel,
  emptyMessage,
  errorMessage,
}) {
  function onStreamEnd() {
    if (trackedFiles.length > 0) {
      const displayCount = Math.min(trackedFiles.length, MAX_TRACKED_LOGS)
      const list = trackedFiles.slice(0, displayCount).map(formatFilePath)

      if (trackedFiles.length > MAX_TRACKED_LOGS) {
        list.push(`... and ${trackedFiles.length - MAX_TRACKED_LOGS} more`)
      }

      loggerInstance.info(`${successLabel} [${trackedFiles.length} files]`)
      loggerInstance.list(successLabel, list)
    } else {
      loggerInstance.debug(emptyMessage)
    }
    cleanup()
  }

  function onStreamError(err) {
    loggerInstance.error(`${errorMessage} Cause: ${err.message}`)
    if (typeof stream.destroy === 'function') {
      stream.destroy()
    }
    cleanup()
  }

  function cleanup() {
    stream.removeListener('end', onStreamEnd)
    stream.removeListener('error', onStreamError)
  }

  stream.on('end', onStreamEnd)
  stream.on('error', onStreamError)

  return stream
}

/**
 * Predicate to suppress specific console warnings commonly emitted by legacy Bootstrap.
 * @param {string} message - Warning message string
 * @returns {boolean} True if the message matches suppression criteria
 */
export function suppressOutdatedBootstrapWarnings(message) {
  const SUPPRESSED_PATTERNS = [
    'Deprecation',
    'deprecated',
    'legacy',
    'slash as division',
  ]

  return (
    typeof message === 'string' &&
    SUPPRESSED_PATTERNS.some((p) =>
      message.toLowerCase().includes(p.toLowerCase())
    )
  )
}

/**
 * Removes files from a directory that do NOT match a specific pattern.
 * Used for production cleanup of non-fingerprinted assets.
 * @param {string} dir - Target directory
 * @param {RegExp} regex - Pattern of files to PRESERVE
 * @param {string} label - Label for logging
 * @param {object} loggerInstance - Logger for reporting
 * @returns {Promise<void>}
 */
export async function cleanupDir(dir, regex, label, loggerInstance) {
  try {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory()) {
        continue
      }
      if (regex.test(entry.name)) {
        continue
      }
      await fs.promises.unlink(path.join(dir, entry.name))
      loggerInstance.info(`Removed ${label}: ${entry.name}`)
    }
  } catch (err) {
    loggerInstance.warn(`Failed to clean up ${label} in ${dir}:`, err)
  }
}
