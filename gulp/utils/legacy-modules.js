/**
 * Legacy modules wrapper for CommonJS compatibility
 * Provides consistent interface for loading CommonJS packages in ES modules environment
 *
 * This module handles packages that haven't been updated to ES modules yet,
 * providing a clean interface while maintaining proper error handling and caching.
 */
import logger from './logger.js'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const legacyModuleCache = new Map()

/**
 * Load CommonJS modules with error handling and caching
 * @param {string} moduleName - Module name to require
 * @returns {any} Required module
 */
export function requireLegacyModule(moduleName) {
  if (legacyModuleCache.has(moduleName)) {
    logger.verbose(`[Legacy] Using cached CommonJS module: ${moduleName}`)
    return legacyModuleCache.get(moduleName)
  }

  try {
    logger.verbose(`[Legacy] Loading CommonJS module: ${moduleName}`)
    const module = require(moduleName)
    legacyModuleCache.set(moduleName, module)
    logger.verbose(
      `[Legacy] Successfully loaded CommonJS module: ${moduleName}`
    )
    return module
  } catch (error) {
    logger.error(
      `[Legacy] Failed to load CommonJS module ${moduleName}:`,
      error
    )
    throw new Error(
      `Failed to load CommonJS module ${moduleName}: ${error.message}`
    )
  }
}

/**
 * Initialize Google Web Fonts module (CommonJS only package)
 * @returns {any} Google Web Fonts module
 */
export function initializeGoogleWebFonts() {
  return requireLegacyModule('gulp-google-webfonts')
}

/**
 * Clear legacy module cache
 * @param {string} [pattern] - Optional pattern to clear specific modules
 */
export function clearLegacyModuleCache(pattern) {
  if (pattern) {
    const keysToDelete = Array.from(legacyModuleCache.keys()).filter((key) =>
      key.includes(pattern)
    )
    keysToDelete.forEach((key) => legacyModuleCache.delete(key))
    logger.verbose(
      `[Legacy] Cleared ${keysToDelete.length} modules matching pattern: ${pattern}`
    )
  } else {
    const totalCleared = legacyModuleCache.size
    legacyModuleCache.clear()
    logger.verbose(`[Legacy] Cleared all ${totalCleared} cached legacy modules`)
  }
}

/**
 * Get legacy module cache statistics
 * @returns {object} Cache statistics
 */
export function getLegacyModuleStats() {
  return {
    cachedLegacyModules: legacyModuleCache.size,
    cachedModuleNames: Array.from(legacyModuleCache.keys()),
  }
}

/**
 * Check if a module is available as CommonJS
 * @param {string} moduleName - Module name to check
 * @returns {boolean} True if module can be loaded
 */
export function isLegacyModuleAvailable(moduleName) {
  try {
    require.resolve(moduleName)
    return true
  } catch {
    return false
  }
}
