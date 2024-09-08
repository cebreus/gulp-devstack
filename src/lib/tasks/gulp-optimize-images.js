import gulp from 'gulp';

import { loadPlugin } from '../helpers.js';
import log from 'fancy-log';
import gulpif from 'gulp-if';
import newer from 'gulp-newer';
import plumber from 'gulp-plumber';
import upng from 'gulp-upng';

/**
 * Process images using gulp-imagemin plugin.
 * @param {string} input - The input path of the images.
 * @param {string} output - The output path for the optimized images.
 * @param {Array} plugins - The array of plugins to be used by gulp-imagemin.
 * @param {object} params - Optional parameters for the image processing.
 * @param {boolean} params.rewriteExisting - Whether to rewrite existing images or not.
 * @param {boolean} params.verbose - Whether to log verbose output or not.
 * @param {Function} params.cb - Callback function to be executed after image processing.
 * @returns {void}
 */
async function processImages(input, output, plugins, params = {}) {
  const imagemin = await loadPlugin('gulp-imagemin');

  const rewriteExisting = !!(
    params.rewriteExisting &&
    typeof params.rewriteExisting === 'boolean' &&
    params.rewriteExisting === true
  );

  if (params.verbose) {
    log(`🟡🟡🟡 Start: ${output}`);
  }

  gulp
    .src(input)
    .pipe(plumber())
    .pipe(gulpif(!rewriteExisting, newer(output)))
    .pipe(imagemin(plugins))
    .pipe(gulp.dest(output))
    .on('end', () => {
      if (params.verbose) {
        log(`🟡🟡🟡 End: ${output}`);
      }
      params.cb();
    });
}

export const optimizeJpg = async (input, output, params = {}) => {
  const mozjpeg = await loadPlugin('imagemin-mozjpeg');
  const plugins = [
    mozjpeg({
      quantTable: 3,
      dcScanOpt: 2,
    }),
  ];
  await processImages(input, output, plugins, params);
};

export const optimizePng = (input, output, params = {}) => {
  const rewriteExisting = !!(
    params.rewriteExisting &&
    typeof params.rewriteExisting === 'boolean' &&
    params.rewriteExisting === true
  );

  if (params.verbose) {
    log(`  🟡🟡 Start: ${output}/*.png`);
  }

  gulp
    .src(input)
    .pipe(plumber())
    .pipe(gulpif(!rewriteExisting, newer(output)))
    .pipe(upng({}))
    .pipe(gulp.dest(output))
    .on('end', () => {
      if (params.verbose) {
        log(`  🟡🟡 End: ${output}/*.png`);
      }
      params.cb();
    });
};

export const optimizeSvg = async (input, output, params = {}) => {
  const svgo = await loadPlugin('imagemin-svgo');
  const plugins = [
    svgo({
      plugins: [
        {
          name: 'removeViewBox',
          active: false,
        },
        {
          name: 'collapseGroups',
          active: true,
        },
      ],
    }),
  ];
  await processImages(input, output, plugins, params);
};
