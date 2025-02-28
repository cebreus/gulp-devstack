import browserSync from 'browser-sync';

const bs = browserSync.create();

/**
 * Initialize BrowserSync
 * @returns {void}
 */
export function browserSyncInit() {
  bs.init({
    server: {
      baseDir: './build',
    },
    port: 3000,
    open: false,
    notify: false,
  });
}

/**
 * Reload BrowserSync
 * @returns {void}
 */
export function browserSyncReload() {
  bs.reload();
}

/**
 * Refresh BrowserSync
 * @param {Function} done - Callback function
 * @returns {void}
 */
export function browserSyncRefresh(done) {
  bs.reload();
  done();
}
