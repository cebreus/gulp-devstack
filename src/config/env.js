import { getEnv } from '../../gulp/utils/index.js'

/**
 * Shared environment configuration for the project.
 * Bridges the gap between Gulp build system and source code.
 */
const isDevelopment = getEnv('NODE_ENV', 'development') === 'development'
const isProduction = getEnv('NODE_ENV') === 'production'
const buildMode = getEnv('BUILD_MODE', 'dev')

export default {
  isDevelopment,
  isProduction,
  buildMode,
}
