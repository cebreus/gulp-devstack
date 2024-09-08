import gulp from 'gulp';

import log from 'fancy-log';
import markdownToJSON from 'gulp-markdown-to-json';
import plumber from 'gulp-plumber';
import rename from 'gulp-rename';
import { marked } from 'marked';
import through2 from 'through2';

marked.setOptions({
  mangle: false,
  headerIds: false,
});

const datasetPrepare = (input, output, params = {}) => {
  const files = [];

  return gulp
    .src(input, { allowEmpty: true })
    .pipe(plumber())
    .pipe(markdownToJSON(marked))
    .pipe(
      rename((path) => {
        if (path.dirname === '.' && path.basename === 'index') {
          path.dirname = '/';
          path.extname = '.json';
        } else if (path.dirname !== '.') {
          path.basename = path.dirname;
          path.dirname = '/';
          path.extname = '.json';
        }
      }),
    )
    .pipe(gulp.dest(output))
    .pipe(
      through2.obj((file, enc, cb) => {
        files.push(file.path);
        if (params.verbose) {
          log(`Processing: ${file.path}`);
        }
        cb(null, file);
      }),
    )
    .on('end', () => {
      if (params.verbose) {
        log(`         ${files.length} JSON written`);
      }
      if (params.cb && typeof params.cb === 'function') {
        params.cb();
      }
    })
    .on('error', (err) => {
      log.error(`Error in datasetPrepare: ${err.message}`);
      if (params.cb && typeof params.cb === 'function') {
        params.cb(err);
      }
    });
};

export default datasetPrepare;
