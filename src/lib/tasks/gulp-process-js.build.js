import gulp from 'gulp';

import log from 'fancy-log';
import babel from 'gulp-babel';
import gulpConcat from 'gulp-concat';
import gulpif from 'gulp-if';
import newer from 'gulp-newer';
import plumber from 'gulp-plumber';
import uglify from 'gulp-uglify';

const processJs = (input, output, params = {}) => {
  const cb = params.cb || (() => {});

  if (typeof cb !== 'function') {
    throw new Error('Callback in params should be of type function.');
  }

  const rewriteExisting = !!(
    params.rewriteExisting &&
    typeof params.rewriteExisting === 'boolean' &&
    params.rewriteExisting === true
  );

  const concatFiles = !!(
    params.concatFiles &&
    typeof params.concatFiles === 'boolean' &&
    params.concatFiles === true
  );

  const outputConcatFileName = `${params.outputConcatPrefixFileName}.min.js`;

  return gulp
    .src(input)
    .pipe(plumber())
    .pipe(gulpif(!rewriteExisting, newer(output)))
    .pipe(
      babel({
        presets: [
          [
            '@babel/preset-env',
            {
              targets: {
                browsers: ['last 2 versions'],
              },
            },
          ],
        ],
      }),
    )
    .pipe(uglify())
    .pipe(gulpif(concatFiles, gulpConcat(outputConcatFileName)))
    .pipe(gulp.dest(output))
    .on('end', () => {
      if (params.verbose) {
        log(`         JS files processed.`);
      }
      cb();
    });
};

export default processJs;
