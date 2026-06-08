import loggerLib from './logger.js'

export {
  attachPipelineLogging,
  cleanupDir,
  ensureDirectoryExists,
  ensureFileIntegrity,
  getDirFromGlob,
  getEnv,
  getRelativePath,
  handleEmptyPaths,
  isPrivateFile,
  streamToPromise,
  suppressOutdatedBootstrapWarnings,
  toKebabCase,
} from './core.js'
export {
  cleanHtmlComments,
  resolveInjectionUrl,
  stripXhtmlSlashes,
} from './html-output.js'
export {
  clearRouteAssetCache,
  discoverRouteScripts,
  discoverRouteStyles,
} from './navigation-assets.js'
export {
  detectType,
  getLqsPlaceholder,
  optimizeWithSharp,
} from './image-helpers.js'
export { createLogger } from './logger.js'
export { loggerLib as logger }

export default loggerLib
