const ftp = require('vinyl-ftp');
const gulp = require('gulp');
const log = require('fancy-log');
require('dotenv').config();

/**
 * Deploys files to an FTP server.
 * @param {string|string[]} input - The file(s) or glob pattern(s) to deploy.
 * @param {string} basePath - The base path for the file(s) to deploy.
 * @param {string} output - The destination path on the FTP server.
 * @param {object} [params] - Additional parameters.
 * @param {Function} [params.cb] - The callback function to execute after deployment.
 * @param {boolean} [params.verbose] - Whether to log verbose output.
 * @throws {Error} If the callback in params is not a function.
 * @returns {void} A readable and writable stream.
 */
const deployFtp = (input, basePath, output, params = {}) => {
  const cb = params.cb || (() => {});

  if (typeof cb !== 'function') {
    throw new Error('Callback in params should be of type function.');
  }

  const conn = ftp.create({
    host: process.env.FTP_HOST,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    parallel: 10,
    log,
  });

  return gulp
    .src(input, { basePath, buffer: false })
    .pipe(conn.newer(input))
    .pipe(conn.dest(output))
    .on('end', () => {
      if (params.verbose) {
        log(`         Done upload to FTP from '${input}' to '${output}'`);
      }
      cb();
    });
};

module.exports = deployFtp;
