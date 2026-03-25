import logger from './logger.js'
import fs from 'fs'
import path from 'path'
import process from 'process'

/**
 * Returns the relative path of a file or directory from the current working directory.
 * @param {string} filePath - The absolute path to the file or directory.
 * @returns {string} The relative path.
 */
export function getRelativePath(filePath) {
  return path.relative(process.cwd(), filePath)
}

/**
 * Create a directory recursively if it doesn't exist, with logging.
 * @param {string} dir - Directory path.
 * @param {object} loggerInstance - The logger instance to use.
 * @returns {Promise<void>}
 */
export async function ensureDirectoryExists(dir, loggerInstance) {
  try {
    await fs.promises.access(dir)
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.promises.mkdir(dir, {
        recursive: true,
      })
      loggerInstance.debug(`Created directory: ${getRelativePath(dir)}`)
    } else {
      throw error
    }
  }
}

/**
 * Sort an array of objects by date.
 * @param {object} a - First object with a 'date' property.
 * @param {object} b - Second object with a 'date' property.
 * @returns {number} Comparison result for sorting.
 */
export function sortByDate(a, b) {
  const dateA = new Date(a.date).getTime()
  const dateB = new Date(b.date).getTime()
  return dateA > dateB ? 1 : -1
}

/**
 * Group an array of objects by a specified key.
 * @param {Array<object>} array - Array of objects to group.
 * @param {string} key - Key to group by.
 * @returns {object} Grouped object.
 */
export function groupBy(array, key) {
  return array.reduce((result, currentValue) => {
    ;(result[currentValue[key]] = result[currentValue[key]] || []).push(
      currentValue
    )
    return result
  }, {})
}

/**
 * Read files asynchronously from a directory.
 * @param {string} dir - Directory path.
 * @returns {Promise<Array<object>>} Promise resolving to an array of file info objects.
 */
export async function readFiles(dir) {
  const files = []

  const filenames = await fs.promises.readdir(dir)

  for (const filename of filenames) {
    const filepath = path.resolve(dir, filename)
    const stat = await fs.promises.stat(filepath)
    const isFile = stat.isFile()

    if (isFile) {
      files.push({
        filepath,
        name: path.parse(filename).name,
        stat,
      })
    }
  }

  files.sort((a, b) => {
    return a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: 'base',
    })
  })

  return files
}

/**
 * Create a directory recursively if it doesn't exist.
 * @param {string} dir - Directory path.
 */
export function mkdirr(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, {
      recursive: true,
    })
  }
}

/**
 * Read and parse a JSON file asynchronously.
 * @param {string} filePath - Path to the JSON file.
 * @returns {Promise<object>} Promise resolving to the parsed JSON object.
 */
export async function readJson(filePath) {
  try {
    const content = await fs.promises.readFile(filePath, {
      encoding: 'utf8',
    })
    return JSON.parse(content)
  } catch (error) {
    logger.error(`Error loading JSON data from ${filePath}`)
    throw error
  }
}

/**
 * Check if a file exists asynchronously.
 * @param {string} filePath - Path to the file.
 * @returns {Promise<boolean>} Promise resolving to true if file exists, false otherwise.
 */
export async function fileExists(filePath) {
  try {
    await fs.promises.access(filePath)
    return true
  } catch (error) {
    if (error.code !== 'ENOENT') {
      logger.error(`Error checking file existence for ${filePath}:`, error)
    }
    return false
  }
}

/**
 * Load required environment variables.
 * @param {Array<string>} requiredVariables - List of required environment variable names.
 * @returns {object} Object with environment variable values.
 * @throws {Error} If any required variable is not set.
 */
export function loadEnvVariables(requiredVariables) {
  const envVariables = {}

  requiredVariables.forEach((variable) => {
    const value = process.env[variable]
    if (!value) {
      throw new Error(`Environment variable ${variable} is not set`)
    }
    envVariables[variable] = value
  })

  return envVariables
}

/**
 * Suppress console warnings for known Bootstrap deprecation, legacy, or @import messages.
 * @param {string} message - The warning message to check and possibly suppress.
 */
/**
 * Suppress console warnings for known Bootstrap deprecation, legacy, or @import messages.
 * Returns true if the warning should be suppressed, false otherwise.
 * @param {string} message - The warning message to check and possibly suppress.
 * @returns {boolean} True if suppressed, false otherwise.
 */
export function suppressOutdatedBootstrapWarnings(message) {
  if (
    typeof message === 'string' &&
    (message.includes('Deprecation') ||
      message.includes('deprecated') ||
      message.includes('legacy') ||
      message.includes('@import'))
  ) {
    // Suppress this warning
    return true
  }
  // Not suppressed, log as warning
  console.warn.apply(console, arguments)

  return false
}

/**
 * Convert a string to kebab-case (lowercase, dash-separated).
 * @param {string} str - The string to convert.
 * @returns {string} The kebab-case version of the input string.
 */
export function toKebabCase(str) {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Checks if the provided paths are empty and logs a message if they are.
 * @param {string|Array<string>} paths - The path(s) to check.
 * @param {string} message - The message to log if paths are empty.
 * @returns {boolean} True if paths are empty, false otherwise.
 */
export function handleEmptyPaths(paths, message) {
  if (
    !paths ||
    (Array.isArray(paths) && paths.length === 0) ||
    (typeof paths === 'string' && paths.trim() === '')
  ) {
    logger.verbose(message)
    return true
  }
  return false
}
