import gulp from 'gulp';
import sourcemaps from 'gulp-sourcemaps';
import concat from 'gulp-concat';
import babel from 'gulp-babel';
import plumber from 'gulp-plumber';
import gulpif from 'gulp-if';
import logger from '../utils/logger.js';
import * as config from '../config/gulpconfig.js';



/**
 * Process JavaScript files with optional concatenation and source maps
 *
 * @param {Array|string} filePaths - Paths to source JS files
 * @param {string} outputDir - Output directory for processed JS files
 * @param {Object} options - Processing options
 * @param {boolean} options.concatFiles - Whether to concatenate all files
 * @param {string} options.outputConcatPrefixFileName - Prefix for concatenated file
 * @param {Function} options.cb - Callback function
 * @returns {Object} - Gulp stream
 */
export default function processJs(filePaths, outputDir, options = {}) {
  const {
    concatFiles = false,
      outputConcatPrefixFileName = 'app',
      cb = null,
  } = options;

  const createSourceMaps = config.sourceMaps ? config.sourceMaps.development :
    false;

  logger.debug(
    `Processing JS files to ${outputDir} with options: concatFiles=${concatFiles}, sourceMaps=${createSourceMaps}`
  );

  // Mark that processJs has run to avoid duplicate processing
  global.processJsRun = true;

  // Create a stream for processing JS files
  let stream = gulp.src(filePaths)
    .pipe(plumber())
    .pipe(gulpif(createSourceMaps, sourcemaps.init()))
    .pipe(babel({
      presets: ['@babel/env']
    }));

  // Handle concatenation if enabled
  if (concatFiles) {
    logger.debug(`Concatenating JS files to ${outputConcatPrefixFileName}.js`);
    stream = stream.pipe(concat(`${outputConcatPrefixFileName}.js`));
  }

  // Write source maps if enabled
  if (createSourceMaps) {
    stream = stream.pipe(sourcemaps.write('.'));
  }

  // Output to destination directory
  stream = stream.pipe(gulp.dest(outputDir));

  // Handle errors with callback if provided
  if (cb && typeof cb === 'function') {
    stream.on('error', cb);
    stream.on('end', cb);
  }

  return stream;
}
