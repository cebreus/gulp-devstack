/**
 * Centralized module manager for handling dynamic imports and CommonJS compatibility
 * Provides consistent, cached module loading across the entire build system
 *
 * This module solves the ES Modules vs CommonJS incompatibility issues by:
 * - Providing singleton pattern for expensive module initializations
 * - Caching loaded modules to prevent multiple loads
 * - Handling both ES modules and CommonJS packages
 * - Offering consistent error handling and logging
 */
import logger from './logger.js'
import { createRequire } from 'node:module'

const moduleCache = new Map()
const initializationPromises = new Map()

/**
 * Load and cache ES modules with singleton pattern
 * Prevents multiple simultaneous loads of the same module
 * @param {string} moduleName - Module name to load
 * @returns {Promise<any>} Loaded module
 */
export async function loadESModule(moduleName) {
  if (moduleCache.has(moduleName)) {
    logger.verbose(`[ModuleManager] Using cached module: ${moduleName}`)
    return moduleCache.get(moduleName)
  }

  // Prevent multiple simultaneous loads of the same module
  if (initializationPromises.has(moduleName)) {
    logger.verbose(
      `[ModuleManager] Waiting for module initialization: ${moduleName}`
    )
    return initializationPromises.get(moduleName)
  }

  logger.verbose(`[ModuleManager] Loading ES module: ${moduleName}`)
  const loadPromise = import(moduleName)
  initializationPromises.set(moduleName, loadPromise)

  try {
    const module = await loadPromise
    moduleCache.set(moduleName, module)
    initializationPromises.delete(moduleName)
    logger.verbose(`[ModuleManager] Successfully loaded module: ${moduleName}`)
    return module
  } catch (error) {
    initializationPromises.delete(moduleName)
    logger.error(`[ModuleManager] Failed to load module ${moduleName}:`, error)
    throw new Error(`Failed to load module ${moduleName}: ${error.message}`)
  }
}

/**
 * Create CommonJS require function for legacy packages
 * @returns {Function} CommonJS require function
 */
export function createLegacyRequire() {
  return createRequire(import.meta.url)
}

/**
 * Initialize and cache gulp-sass with proper configuration
 * This is the most commonly used dynamic import in the project
 * @returns {Promise<Function>} Configured sass compiler
 */
export async function initializeSass() {
  const cacheKey = 'gulp-sass-configured'

  if (moduleCache.has(cacheKey)) {
    logger.verbose('[ModuleManager] Using cached Sass compiler')
    return moduleCache.get(cacheKey)
  }

  if (initializationPromises.has(cacheKey)) {
    logger.verbose('[ModuleManager] Waiting for Sass compiler initialization')
    return initializationPromises.get(cacheKey)
  }

  logger.info('[ModuleManager] Initializing Sass compiler...')
  const initPromise = (async () => {
    const [{ default: gulpSassModule }, sassModule] = await Promise.all([
      import('gulp-sass'),
      import('sass'),
    ])

    return gulpSassModule(sassModule)
  })()

  initializationPromises.set(cacheKey, initPromise)

  try {
    const gulpSass = await initPromise
    moduleCache.set(cacheKey, gulpSass)
    initializationPromises.delete(cacheKey)
    logger.info('[ModuleManager] Sass compiler initialized successfully')
    return gulpSass
  } catch (error) {
    initializationPromises.delete(cacheKey)
    logger.error('[ModuleManager] Failed to initialize Sass compiler:', error)
    throw new Error(`Failed to initialize Sass: ${error.message}`)
  }
}

/**
 * Initialize image optimization modules with parallel loading
 * @returns {Promise<object>} Object containing all image optimization modules
 */
export async function initializeImageOptimizers() {
  const cacheKey = 'image-optimizers'

  if (moduleCache.has(cacheKey)) {
    logger.verbose('[ModuleManager] Using cached image optimizers')
    return moduleCache.get(cacheKey)
  }

  if (initializationPromises.has(cacheKey)) {
    logger.verbose(
      '[ModuleManager] Waiting for image optimizers initialization'
    )
    return initializationPromises.get(cacheKey)
  }

  logger.info('[ModuleManager] Initializing image optimization modules...')
  const initPromise = (async () => {
    const [mozjpegModule, upngModule, svgoModule] = await Promise.all([
      import('imagemin-mozjpeg'),
      import('gulp-upng'),
      import('imagemin-svgo'),
    ])

    return {
      mozjpeg: mozjpegModule,
      upng: upngModule,
      svgo: svgoModule,
    }
  })()

  initializationPromises.set(cacheKey, initPromise)

  try {
    const optimizers = await initPromise
    moduleCache.set(cacheKey, optimizers)
    initializationPromises.delete(cacheKey)
    logger.info(
      '[ModuleManager] Image optimization modules initialized successfully'
    )
    return optimizers
  } catch (error) {
    initializationPromises.delete(cacheKey)
    logger.error(
      '[ModuleManager] Failed to initialize image optimizers:',
      error
    )
    throw new Error(`Failed to initialize image optimizers: ${error.message}`)
  }
}

/**
 * Initialize CommonJS modules with caching
 * @param {string} moduleName - CommonJS module name to require
 * @returns {any} Required CommonJS module
 */
export function initializeLegacyModule(moduleName) {
  const cacheKey = `legacy-${moduleName}`

  if (moduleCache.has(cacheKey)) {
    logger.verbose(`[ModuleManager] Using cached legacy module: ${moduleName}`)
    return moduleCache.get(cacheKey)
  }

  try {
    logger.verbose(`[ModuleManager] Loading legacy module: ${moduleName}`)
    const require = createLegacyRequire()
    const module = require(moduleName)
    moduleCache.set(cacheKey, module)
    logger.verbose(
      `[ModuleManager] Successfully loaded legacy module: ${moduleName}`
    )
    return module
  } catch (error) {
    logger.error(
      `[ModuleManager] Failed to load legacy module ${moduleName}:`,
      error
    )
    throw new Error(
      `Failed to load legacy module ${moduleName}: ${error.message}`
    )
  }
}

/**
 * Clear module cache (useful for testing and development)
 * @param {string} [pattern] - Optional pattern to clear specific modules
 */
export function clearModuleCache(pattern) {
  if (pattern) {
    const keysToDelete = Array.from(moduleCache.keys()).filter((key) =>
      key.includes(pattern)
    )
    const promiseKeysToDelete = Array.from(
      initializationPromises.keys()
    ).filter((key) => key.includes(pattern))

    keysToDelete.forEach((key) => moduleCache.delete(key))
    promiseKeysToDelete.forEach((key) => initializationPromises.delete(key))

    logger.verbose(
      `[ModuleManager] Cleared ${keysToDelete.length + promiseKeysToDelete.length} modules matching pattern: ${pattern}`
    )
  } else {
    const totalCleared = moduleCache.size + initializationPromises.size
    moduleCache.clear()
    initializationPromises.clear()
    logger.verbose(`[ModuleManager] Cleared all ${totalCleared} cached modules`)
  }
}

/**
 * Get module cache statistics for monitoring and debugging
 * @returns {object} Cache statistics
 */
export function getModuleCacheStats() {
  return {
    cachedModules: moduleCache.size,
    pendingInitializations: initializationPromises.size,
    cachedModuleNames: Array.from(moduleCache.keys()),
    pendingModuleNames: Array.from(initializationPromises.keys()),
    totalMemoryFootprint: moduleCache.size + initializationPromises.size,
  }
}

/**
 * Preload commonly used modules to improve performance
 * @returns {Promise<void>}
 */
export async function preloadCommonModules() {
  logger.info('[ModuleManager] Preloading common modules...')

  try {
    await Promise.all([
      initializeSass(),
      // Add other commonly used modules here
    ])
    logger.info('[ModuleManager] Common modules preloaded successfully')
  } catch (error) {
    logger.warn('[ModuleManager] Some modules failed to preload:', error)
  }
}
