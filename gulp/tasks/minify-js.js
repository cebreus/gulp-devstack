import fs from 'fs';
import {
  glob
} from 'glob';
import gulp from 'gulp';
import sourcemaps from 'gulp-sourcemaps';
import rename from 'gulp-rename';
import uglify from 'gulp-uglify';
import plumber from 'gulp-plumber';
import logger from '../utils/logger.js';


/**
 * Minify JavaScript files and generate source maps for production.
 * This task should run AFTER process-js.js has generated the transpiled files.
 *
 * @param {Object} config - Configuration object
 * @param {Function} cb - Callback function
 * @returns {Promise<void>|NodeJS.ReadWriteStream} - Gulp stream or Promise
 */
export default function jsMinify(config, cb) {
  const {
    jsBuild,
    sourceMaps = {
      production: true
    }
  } = config;

  const createSourceMaps = sourceMaps.production;

  logger.info('Starting JavaScript minification');
  logger.debug(`Source files: ${jsBuild}/*.js`);



  // Verify that input directory exists (should have been created by process-js)
  if (!fs.existsSync(jsBuild)) {
    logger.error(
      `Error: Input directory ${jsBuild} does not exist. Make sure process-js has run first.`
    );
    if (cb) cb(new Error(`Input directory ${jsBuild} does not exist`));
    return Promise.reject(new Error(
      `Input directory ${jsBuild} does not exist`));
  }

  const outputDir = `${jsBuild}/min`;

  // Ensure the output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, {
      recursive: true
    });
    logger.debug(`Created directory: ${outputDir}`);
  }

  // Find all JS files that are not already minified
  const jsFiles = glob.sync(`${jsBuild}/**/*.js`)
    .filter(file => !file.includes('.min.js') && !file.includes('.map'));

  logger.debug(`Found ${jsFiles.length} JS files to minify:`);
  jsFiles.forEach(file => logger.debug(`- ${file}`));

  if (jsFiles.length === 0) {
    logger.debug('No JavaScript files found to minify');
    if (cb) cb();
    return Promise.resolve();
  }

  let stream = gulp.src(jsFiles, {
    base: jsBuild
  });

  // Only initialize source maps if enabled in config
  if (createSourceMaps) {
    stream = stream.pipe(sourcemaps.init());
    logger.debug('Generating source maps for minified files');
  }

  stream = stream.pipe(plumber())
    .pipe(rename(path => {
      path.basename += '.min';
      logger.debug(`Minifying: ${path.basename}`);
      return path;
    }))
    .pipe(uglify({
      compress: {
        dead_code: true,
        drop_debugger: false, // Keep debugger statements
        drop_console: false, // Keep all console logs
        pure_funcs: null, // Don't remove any functions
        conditionals: true,
        evaluate: true,
        sequences: true,
        booleans: true,
        unused: true
      },
      mangle: true,
      output: {
        comments: 'some' // Keep important comments
      }
    }));

  // Only write source maps if enabled in config
  if (createSourceMaps) {
    stream = stream.pipe(sourcemaps.write('./'));
    logger.info('Source maps have been written to external files');
  }

  stream = stream.pipe(gulp.dest(outputDir))
    .on('end', () => {
      logger.info(
        `Successfully minified ${jsFiles.length} JavaScript files${createSourceMaps ? ' with source maps' : ''}`
      );
      if (cb) cb();
    })
    .on('error', (err) => {
      logger.error('JavaScript minification error:', err);
      if (cb) cb(err);
    });

  logger.info('JavaScript minification completed');

  return stream;
}
