const gulp = require('gulp');
const gutil = require('gulp-util');
const ftp = require('vinyl-ftp');
require('dotenv').config();

/**
 * @description Deploy files and folders to FTP
 * @param {string} input path to folder to deploy
 * @return {stream} Compiled file
 */

const deployFtp = (input, base, output, cb) => {
  let conn = ftp.create({
    host: process.env.FTP_HOST,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    parallel: 10,
    log: gutil.log,
  });

  return gulp
    .src(input, { base, buffer: false })
    .pipe(conn.newer(input))
    .pipe(conn.dest(output))

    .on('end', cb);
};

module.exports = deployFtp;
