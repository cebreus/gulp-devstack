import { buildBase } from '../config.js'
import { getEnv } from '../utils/env.js'
import browserSync from 'browser-sync'

const bs = browserSync.create()

/**
 * Initializes BrowserSync for live-reloading during development.
 * Reads port, open, and notify options from environment variables using getEnv utility.
 * @returns {Promise<void>} Resolves when BrowserSync is initialized.
 */
export async function browserSyncInit() {
  const port = getEnv('BROWSERSYNC_PORT', 3000)
  const open = getEnv('BROWSERSYNC_OPEN', false)
  const notify = getEnv('BROWSERSYNC_NOTIFY', false)

  return new Promise((resolve, reject) => {
    bs.init(
      {
        server: {
          baseDir: buildBase(),
        },
        port,
        open,
        notify,
      },
      (err) => {
        if (err) return reject(err)
        resolve()
      }
    )
  })
}

/**
 * Reloads all connected browsers via BrowserSync.
 * @returns {Promise<void>} Resolves when reload is triggered.
 */
export async function browserSyncReload() {
  return new Promise((resolve) => {
    bs.reload()
    resolve()
  })
}

/**
 * Alias for browserSyncReload (for API clarity).
 * @returns {Promise<void>} Resolves when reload is triggered.
 */
export async function browserSyncRefresh() {
  return browserSyncReload()
}
