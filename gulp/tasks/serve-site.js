import browserSync from 'browser-sync'

import { getEnv } from '../utils/index.js'

const serverInstance = browserSync.create()

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

export default {
  init: initializeServer,
  reload: reloadBrowser,
}
