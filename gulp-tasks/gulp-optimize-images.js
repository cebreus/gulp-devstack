const gulp = require('gulp');
const gulpif = require('gulp-if');
const log = require('fancy-log');
const newer = require('gulp-newer');
const plumber = require('gulp-plumber');
const upng = require('gulp-upng');
const { loadPlugin } = require('./helpers');

/**
 * Process images using gulp-imagemin plugin.
 * @param {string} input - The input path or glob pattern for the images.
 * @param {string} output - The output path for the optimized images.
 * @param {Array} plugins - An array of imagemin plugins to use for optimization.
 * @param {object} [params] - Additional parameters for customization.
 * @param {boolean} [params.rewriteExisting] - Whether to rewrite existing images.
 * @param {boolean} [params.verbose] - Whether to log verbose output.
 * @param {Function} params.cb - Callback function to execute after processing images.
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

const optimizeJpg = async (input, output, params = {}) => {
  const mozjpeg = await loadPlugin('imagemin-mozjpeg');
  const plugins = [
    mozjpeg({
      quantTable: 3,
      dcScanOpt: 2,
    }),
  ];
  await processImages(input, output, plugins, params);
};

const optimizePng = (input, output, params = {}) => {
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

const optimizeSvg = async (input, output, params = {}) => {
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

module.exports = {
  optimizeJpg,
  optimizePng,
  optimizeSvg,
};
