import gulp from 'gulp';

import { loadPlugin } from '../helpers.js';
import log from 'fancy-log';
import revDelete from 'gulp-rev-delete-original';
import revReplace from 'gulp-rev-replace';
import revRewrite from 'gulp-rev-rewrite';

const revision = async (params) => {
  const rev = await loadPlugin('gulp-rev');
  const cb = params.cb || (() => { });

  if (typeof cb !== 'function') {
    throw new Error('Callback in params should be of type function.');
  }

  return gulp
    .src(params.inputRevision)
    .pipe(rev())
    .pipe(revReplace())
    .pipe(revDelete())
    .pipe(gulp.dest(params.outputRevision))
    .pipe(gulp.dest(params.ouputManifest))
    .pipe(gulp.src(params.inputRewrite))
    .pipe(revRewrite(params.manifestFile))
    .pipe(gulp.dest(params.outputRewrite))
    .on('end', () => {
      if (params.verbose) {
        log(
          `         Unique asset hashes, updates HTML references, removes old hashes done.`,
        );
      }
      cb();
    });
};

export default revision;
