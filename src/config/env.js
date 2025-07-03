import { getEnv } from '../../gulp/utils/env.js'

/**
 * Shared environment configuration for the project.
 * Bridges the gap between Gulp build system and source code.
 */
export const isDevelopment = getEnv('NODE_ENV', 'development') === 'development'
export const isProduction = getEnv('NODE_ENV') === 'production'
export const buildMode = getEnv('BUILD_MODE', 'dev')

export default {
  isDevelopment,
  isProduction,
  buildMode,
}
