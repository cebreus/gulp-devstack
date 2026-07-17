import browserSync from 'browser-sync'

import serveBuildError from '../utils/dev-error-page.js'
import { getEnv } from '../utils/index.js'

const serverInstance = browserSync.create()
let buildError

/**
 * BrowserSync middleware that replaces stale HTML after a build failure.
 * @param {import('node:http').IncomingMessage} request - HTTP request.
 * @param {import('node:http').ServerResponse} response - HTTP response.
 * @param {function(): void} next - Continue to BrowserSync static serving.
 * @returns {void}
 */
export function buildErrorMiddleware(request, response, next) {
  if (!serveBuildError(request, response, buildError)) {
    next()
  }
}

async function initializeServer(config) {
  const SERVER_PORT = getEnv('BROWSERSYNC_PORT', 3000)
  const AUTO_OPEN_BROWSER = getEnv('BROWSERSYNC_OPEN', false)
  const SHOW_NOTIFICATIONS = getEnv('BROWSERSYNC_NOTIFY', false)

  const buildRoot = config.paths.build

  return new Promise((resolve, reject) => {
    serverInstance.init(
      {
        server: {
          baseDir: buildRoot,
        },
        middleware: {
          handle: buildErrorMiddleware,
          override: true,
          route: '',
        },
        port: SERVER_PORT,
        open: AUTO_OPEN_BROWSER,
        notify: SHOW_NOTIFICATIONS,
        watch: false,
      },
      (error) => {
        if (error) {
          return reject(error)
        }
        resolve()
      }
    )
  })
}

function reloadBrowser(changedFiles) {
  serverInstance.reload(changedFiles)
}

function markBuildFailed(error) {
  buildError = error instanceof Error ? error : new Error(String(error))
  reloadBrowser()
}

function markBuildReady() {
  buildError = undefined
}

export default {
  fail: markBuildFailed,
  init: initializeServer,
  ready: markBuildReady,
  reload: reloadBrowser,
}
