import gulp from 'gulp';
import logger from '../utils/logger.js';

/**
 * Copies static files from source to destination
 * @param {string|string[]} src - Source paths
 * @param {string} baseDir - Base directory to resolve relative paths from
 * @param {string} dest - Destination directory
 * @returns {stream.Transform} - Gulp stream
 */
export default function copyStatic(src, baseDir, dest, {
  cb = null,
} = {}) {

  logger.debug(`Copying static files from ${src} to ${dest}`);

  return gulp
    .src(src, {
      base: baseDir
    })
    .pipe(gulp.dest(dest))
    .on('end', () => {
      if (typeof cb === 'function') cb();
    });
}
