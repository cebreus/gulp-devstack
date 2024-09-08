import gulp from 'gulp';

// Import process to access environment variables
import log from 'fancy-log';
import process from 'process';
import ftp from 'vinyl-ftp';

const deployFtp = (input, basePath, output, params = {}) => {
  const cb = params.cb || (() => {});

  if (typeof cb !== 'function') {
    throw new Error('Callback in params should be of type function.');
  }

  // Use environment variables for FTP connection
  const conn = ftp.create({
    host: process.env.FTP_HOST, // Loaded from .env.local
    user: process.env.FTP_USER, // Loaded from .env.local
    password: process.env.FTP_PASSWORD, // Loaded from .env.local
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

export default deployFtp;
