const gulp = require('gulp');
const browsersync = require('browser-sync').create();

const config = require('../gulpconfig');

/**
 * @description BrowserSync init and config
 */

function browserSync() {
  browsersync.init({
    server: {
      baseDir: config.buildBase,
    },
    port: 4000,
    notify: false,
    // proxy: 'yourdomain.dev',
    // tunnel: true
  });
}

/**
 * @description BrowserSync reload
 */

function browserSyncReload(done) {
  browsersync.reload();
  done();
}

module.exports = { browserSync, browserSyncReload };
