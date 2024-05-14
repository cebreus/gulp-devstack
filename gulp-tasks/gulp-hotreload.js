const browsersync = require('browser-sync').create();
const config = require('../gulpconfig');

/**
 *Initialize BrowserSync with given configuration
 */
function browserSync() {
  browsersync.init({
    server: {
      baseDir: config.buildBase,
    },
    port: 4000,
    notify: false,
    open: false,
  });
}

/**
 * Reloads the browser using BrowserSync.
 * @param {Function} done - The callback function to be called when the browser is reloaded.
 */
function browserSyncRefresh(done) {
  browsersync.reload();
  done();
}

/**
 * Reload BrowserSync
 */
function browserSyncReload() {
  browsersync.reload();
}

module.exports = { browserSync, browserSyncRefresh, browserSyncReload };
