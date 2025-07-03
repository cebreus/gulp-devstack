import browserSync from 'browser-sync'

import { buildBase } from '../config.js'
import { getEnv } from '../utils/env.js'

const serverInstance = browserSync.create()

/**
 * Initializes the development server using BrowserSync.
 * Configured via environment variables for port, interactivity and notifications.
 * @returns {Promise<void>} Resolves when the server is ready
 */
export async function initializeServer() {
  const SERVER_PORT = getEnv('BROWSERSYNC_PORT', 3000)
  const AUTO_OPEN_BROWSER = getEnv('BROWSERSYNC_OPEN', false)
  const SHOW_NOTIFICATIONS = getEnv('BROWSERSYNC_NOTIFY', false)

  return new Promise((resolve, reject) => {
    serverInstance.init(
      {
        server: {
          baseDir: buildBase(),
        },
        port: SERVER_PORT,
        open: AUTO_OPEN_BROWSER,
        notify: SHOW_NOTIFICATIONS,
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
 * @returns {Promise<void>} Resolves when the signal is sent
 */
export async function reloadBrowser() {
  return new Promise((resolve) => {
    serverInstance.reload()
    resolve()
  })
}

/**
 * Signal-only webserver refresh (Alias for reloadBrowser).
 * Used in Gulp watch pipelines.
 * @returns {Promise<void>}
 */
export async function refreshServer() {
  return reloadBrowser()
}

export default {
  init: initializeServer,
  reload: reloadBrowser,
  refresh: refreshServer,
}
