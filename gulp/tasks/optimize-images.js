import gulp from 'gulp';
import imagemin from 'gulp-imagemin';
import plumber from 'gulp-plumber';
import {
  imagesBuild
} from '../config/gulpconfig.js';
import logger from '../utils/logger.js';

/**
 * Optimizes JPG images using dynamic import for imagemin-mozjpeg.
 * @param {string|string[]} src - Source JPG files
 * @param {string} dest - Destination directory
 * @param {Object} options - Options (quality, cb)
 * @returns {Promise<NodeJS.ReadWriteStream>}
 */
export async function optimizeJpg(src, dest, options = {}) {
  const {
    quality = 85, cb = null
  } = options;

  // Ensure destination is valid
  const destination = dest || imagesBuild;
  if (!destination) {
    logger.error('Invalid destination for JPG optimization');
    if (cb) cb(new Error('Invalid destination'));
    return;
  }

  logger.debug(`Optimizing JPG files from ${src} to ${destination}`);

  const mozjpegModule = await import('imagemin-mozjpeg');
  const mozjpeg = mozjpegModule.default;

  // Create and return a promise to ensure task completion is tracked
  return new Promise((resolve) => {
    gulp.src(src)
      .pipe(plumber())
      .pipe(imagemin([mozjpeg({
        quality,
        progressive: true
      })], {
        onComplete: (filename) => logger.debug(
          `Optimized JPG: ${filename}`)
      }))
      .pipe(gulp.dest(destination))
      .on('end', () => {
        if (cb) cb();
        resolve();
      });
  });
}

/**
 * Optimizes PNG images using dynamic import for imagemin-pngquant.
 * @param {string|string[]} src - Source PNG files
 * @param {string} dest - Destination directory
 * @param {Object} options - Options (quality, cb)
 * @returns {Promise<NodeJS.ReadWriteStream>}
 */
export async function optimizePng(src, dest, options = {}) {
  const {
    quality = [0.6, 0.8], cb = null
  } = options;

  // Ensure destination is valid
  const destination = dest || imagesBuild;
  if (!destination) {
    logger.error('Invalid destination for PNG optimization');
    if (cb) cb(new Error('Invalid destination'));
    return;
  }

  logger.debug(`Optimizing PNG files from ${src} to ${destination}`);

  let pngquant;
  try {
    const pngquantModule = await import('imagemin-pngquant');
    pngquant = pngquantModule.default;
  } catch (error) {
    logger.error(
      "Package 'imagemin-pngquant' not found. Please run: pnpm add imagemin-pngquant"
    );
    if (cb) cb(error);
    return;
  }

  // Create and return a promise to ensure task completion is tracked
  return new Promise((resolve) => {
    gulp.src(src)
      .pipe(plumber())
      .pipe(imagemin([pngquant({
        quality,
        speed: 1,
        strip: true
      })], {
        onComplete: (filename) => logger.debug(
          `Optimized PNG: ${filename}`)
      }))
      .pipe(gulp.dest(destination))
      .on('end', () => {
        if (cb) cb();
        resolve();
      });
  });
}

/**
 * Optimizes SVG images using dynamic import for imagemin-svgo.
 * @param {string|string[]} src - Source SVG files
 * @param {string} dest - Destination directory
 * @param {Object} options - Options (cb)
 * @returns {Promise<NodeJS.ReadWriteStream>}
 */
export async function optimizeSvg(src, dest, options = {}) {
  const {
    cb = null
  } = options;

  // Ensure destination is valid
  const destination = dest || imagesBuild;
  if (!destination) {
    logger.error('Invalid destination for SVG optimization');
    if (cb) cb(new Error('Invalid destination'));
    return;
  }

  logger.debug(`Optimizing SVG files from ${src} to ${destination}`);

  const svgoModule = await import('imagemin-svgo');
  const svgo = svgoModule.default;

  // Create and return a promise to ensure task completion is tracked
  return new Promise((resolve) => {
    gulp.src(src)
      .pipe(plumber())
      .pipe(imagemin([
        svgo({
          plugins: [{
              name: 'removeViewBox',
              active: false
            },
            {
              name: 'cleanupIDs',
              active: false
            },
            {
              name: 'removeUselessStrokeAndFill',
              active: true
            },
            {
              name: 'removeEmptyAttrs',
              active: true
            }
          ]
        })
      ], {
        onComplete: (filename) => logger.debug(
          `Optimized SVG: ${filename}`)
      }))
      .pipe(gulp.dest(destination))
      .on('end', () => {
        if (cb) cb();
        resolve();
      });
  });
}
