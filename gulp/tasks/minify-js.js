import fs from 'node:fs';

import { glob } from 'glob';
import gulp from 'gulp';
import plumber from 'gulp-plumber';
import rename from 'gulp-rename';
import sourcemaps from 'gulp-sourcemaps';

import logger from '../utils/logger.js';

/**
 * Minify JavaScript files and generate source maps for production.
 * This task should run AFTER process-js.js has generated the transpiled files.
 * @param {object} config - Configuration object
 * @param {Function} cb - Callback function
 * @returns {Promise<void>|any} - Gulp stream (NodeJS.ReadWriteStream) or Promise
 */
export default function jsMinify(config, cb) {
  const {
    jsBuild,
    sourceMaps = {
      production: true,
    },
  } = config;

  const createSourceMaps = sourceMaps.production;

  logger.verbose('Starting JavaScript minification');
  logger.debug(`Source files: ${jsBuild}/*.js`);

  // Verify that the input directory exists.
  if (!fs.existsSync(jsBuild)) {
    logger.error(
      `Error: Input directory ${jsBuild} does not exist. Make sure process-js has run first.`,
    );
    if (cb) cb(new Error(`Input directory ${jsBuild} does not exist`));
    return Promise.reject(
      new Error(`Input directory ${jsBuild} does not exist`),
    );
  }

  const outputDir = `${jsBuild}/min`;

  // Create the output directory if it doesn't exist.
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, {
      recursive: true,
    });
    logger.debug(`Created directory: ${outputDir}`);
  }

  // Find all JavaScript files that are not already minified.
  const jsFiles = glob
    .sync(`${jsBuild}/**/*.js`)
    .filter((file) => !file.includes('.min.js') && !file.includes('.map'));

  logger.debug(`Found ${jsFiles.length} JS files to minify:`);
  jsFiles.forEach((file) => logger.debug(`- ${file}`));

  if (jsFiles.length === 0) {
    logger.debug('No JavaScript files found to minify');
    if (cb) cb();
    return Promise.resolve();
  }

  let stream = gulp.src(jsFiles, {
    base: jsBuild,
  });

  // Initialize source maps if enabled.
  if (createSourceMaps) {
    stream = stream.pipe(sourcemaps.init());
    logger.debug('Generating source maps for minified files');
  }

  stream = stream
    .pipe(plumber())
    .pipe(
      rename((path) => {
        path.basename += '.min';
        logger.debug(`Minifying: ${path.basename}`);
        return path;
      }),
    )
    .pipe(
      terser({
        compress: {
          dead_code: true,
          drop_debugger: false,
          drop_console: false,
          pure_funcs: null,
          conditionals: true,
          evaluate: true,
          sequences: true,
          booleans: true,
          unused: true,
        },
        mangle: true,
        output: {
          comments: 'some',
        },
      }),
    );

  // Write source maps if enabled.
  if (createSourceMaps) {
    stream = stream.pipe(sourcemaps.write('./'));
    logger.verbose('Source maps have been written to external files');
  }

  stream = stream
    .pipe(gulp.dest(outputDir))
    .on('end', () => {
      logger.verbose(
        `Successfully minified ${jsFiles.length} JavaScript files${createSourceMaps ? ' with source maps' : ''}`,
      );
      if (cb) cb();
    })
    .on('error', (err) => {
      logger.error('JavaScript minification error:', err);
      if (cb) cb(err);
    });

  logger.verbose('JavaScript minification completed');

  return stream;
}
