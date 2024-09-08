import gulp from 'gulp';

import { loadPlugin } from '../helpers.js';
import log from 'fancy-log';

const iconGenerator = async (input, output, params) => {
  const favicons = await loadPlugin('gulp-favicons');
  const cb = params.cb || (() => { });

  if (typeof cb !== 'function') {
    throw new Error('Callback in params should be of type function.');
  }

  return gulp
    .src(input)
    .pipe(favicons(params.config))
    .pipe(gulp.dest(output))
    .on('end', () => {
      if (params.verbose) {
        log(`         Favicons created`);
      }
      cb();
    });
};

export default iconGenerator;
