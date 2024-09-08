import gulp from 'gulp';

import log from 'fancy-log';
import validate from 'gulp-html-validate';

const htmlValidate = (input, params) => {
  const cb = params.cb || (() => {});

  if (typeof cb !== 'function') {
    throw new Error('Callback in params should be of type function.');
  }

  return gulp
    .src(input)
    .pipe(validate())
    .pipe(validate.format())
    .pipe(validate.failAfterError())
    .on('end', () => {
      if (params.verbose) {
        log(`         HTML validation in ${input}`);
      }
      cb();
    });
};

export default htmlValidate;
