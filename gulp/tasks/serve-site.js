import browserSync from 'browser-sync'

import { getEnv } from '../utils/index.js'

const serverInstance = browserSync.create()

/**
 * Initializes the development server using BrowserSync.
 * Configured via environment variables for port, interactivity and notifications.
 * @param {object} config - Configuration object
 * @param {object} config.paths - Path mapping object
 * @param {string} config.paths.build - Root build directory
 * @returns {Promise<void>} Resolves when the server is ready
 */
export async function initializeServer(config) {
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
        port: SERVER_PORT,
        open: AUTO_OPEN_BROWSER,
        notify: SHOW_NOTIFICATIONS,
        watch: false,
      },
      (error) => {
        if (error) return reject(error)
        resolve()
      }
    )
  })
}

/**
 * Triggers a live-reload of all connected browser clients.
 * @returns {void}
 */
export function reloadBrowser() {
  serverInstance.reload()
}

/**
 * Signal-only webserver refresh (Alias for reloadBrowser).
 * Used in Gulp watch pipelines.
 * @returns {void}
 */
export function refreshServer() {
  reloadBrowser()
}

/**
 * Injects changes (e.g. CSS) into the browser without full reload.
 * @returns {import('node:stream').ReadWriteStream} BrowserSync stream
 */
export function injectChanges() {
  return serverInstance.stream()
}

export default {
  init: initializeServer,
  reload: reloadBrowser,
  refresh: refreshServer,
  inject: injectChanges,
}
