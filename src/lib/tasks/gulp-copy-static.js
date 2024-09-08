import gulp from 'gulp';

import log from 'fancy-log';
import plumber from 'gulp-plumber';

const copy = (input, basePath, output, params = {}) => {
  const cb = params.cb || (() => {});

  if (typeof cb !== 'function') {
    throw new Error('Callback in params should be of type function.');
  }

  return gulp
    .src(input, { base: basePath })
    .pipe(plumber())
    .pipe(gulp.dest(output))
    .on('end', () => {
      if (params.verbose) {
        log(`         Copied files from '${input}' to '${output}'`);
      }
      cb();
    });
};

export default copy;
