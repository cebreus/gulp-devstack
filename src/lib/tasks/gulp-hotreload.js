import * as config from '../constants/gulpconfig.js';
import browserSync from 'browser-sync';

const bs = browserSync.create();

/**
 * Initializes the browserSync server.
 * @param {Function} done - The callback function to signal task completion.
 */
export function browserSyncInit(done) {
  bs.init({
    server: {
      baseDir: config.buildBase, // Ensure config.buildBase is defined and valid
    },
    port: 4000,
    notify: false,
    open: false,
  });

  done(); // Call done to signal task completion
}

/**
 * Refreshes the browser using BrowserSync.
 * @param {Function} done - The callback function to be called when the browser is refreshed.
 */
export function browserSyncRefresh(done) {
  bs.reload();
  done();
}

/**
 * Reloads the browser using BrowserSync.
 */
export function browserSyncReload() {
  bs.reload();
}
