import gulp from 'gulp';

import log from 'fancy-log';
import gulpClean from 'gulp-clean';
import plumber from 'gulp-plumber';

const clean = (input, params = {}) => {
  const cb = params.cb || (() => {});

  if (typeof cb !== 'function') {
    throw new Error('Callback in params should be of type function.');
  }

  return gulp
    .src(input, { read: false, allowEmpty: true })
    .pipe(plumber())
    .pipe(gulpClean())
    .on('end', () => {
      if (params.verbose) {
        log(`         Files in '${input}' deleted.`);
      }
      cb();
    });
};

export default clean;
