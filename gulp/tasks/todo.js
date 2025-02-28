import gulp from 'gulp';
import todo from 'gulp-todo';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.js';

/**
 * Scans the codebase for TODO comments and generates a report
 * @param {Function} done - Callback function
 * @returns {NodeJS.ReadWriteStream} - Gulp stream
 */
export default function todoTask(done) {
  const outputDir = './.reports';

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, {
      recursive: true
    });
  }

  return gulp.src([
      './src/**/*.{js,scss,html}',
      './gulp/**/*.js',
      '!./node_modules/**/*'
    ])
    .pipe(todo({
      fileName: 'TODO.md'
    }))
    .pipe(gulp.dest(outputDir))
    .on('end', () => {
      logger.debug(
        `TODO report generated at ${path.join(outputDir, 'TODO.md')}`
      );
      if (done) done();
    });
}
