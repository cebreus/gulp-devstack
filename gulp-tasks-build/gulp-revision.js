const gulp = require('gulp');
const log = require('fancy-log');
const revDelete = require('gulp-rev-delete-original');
const revReplace = require('gulp-rev-replace');
const revRewrite = require('gulp-rev-rewrite');
const { loadPlugin } = require('../gulp-tasks/helpers');

/**
 * Performs asset revisioning by adding unique hashes to the filenames and updating HTML references.
 * @param {object} params - The parameters for the revision task.
 * @param {Function} params.cb - The callback function to be executed after the revision task is complete.
 * @param {string} params.inputRevision - The input path for the files to be revised.
 * @param {string} params.outputRevision - The output path for the revised files.
 * @param {string} params.ouputManifest - The output path for the manifest file.
 * @param {string} params.inputRewrite - The input path for the files to be rewritten.
 * @param {string} params.manifestFile - The path to the manifest file.
 * @param {string} params.outputRewrite - The output path for the rewritten files.
 * @param {boolean} params.verbose - Determines whether to log verbose output.
 * @returns {void} - A stream representing the revision task.
 * @throws {Error} - If the callback in params is not a function.
 */
const revision = async (params) => {
  const rev = await loadPlugin('gulp-rev');
  const cb = params.cb || (() => {});

  if (typeof cb !== 'function') {
    throw new Error('Callback in params should be of type function.');
  }

  return (
    gulp
      .src(params.inputRevision)
      .pipe(rev())
      .pipe(revReplace())
      .pipe(revDelete())
      .pipe(gulp.dest(params.outputRevision))
      .pipe(gulp.dest(params.ouputManifest))
      .pipe(gulp.src(params.inputRewrite))
      .pipe(revRewrite(params.manifestFile))
      .pipe(gulp.dest(params.outputRewrite))
      // .pipe(gulpBrotli())
      // .pipe(gulp.dest(params.outputRewrite))
      .on('end', () => {
        if (params.verbose) {
          log(
            `         Unique asset hashes, updates HTML references, removes old hashes done.`,
          );
        }
        cb();
      })
  );
};

module.exports = revision;
