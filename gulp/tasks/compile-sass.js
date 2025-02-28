import {
  createRequire
} from 'module';
import gulp from 'gulp';
import autoprefixer from 'autoprefixer';
import concat from 'gulp-concat';
import cssnano from 'cssnano';
import pixrem from 'pixrem';
import postcss from 'gulp-postcss';
import sourcemaps from 'gulp-sourcemaps';
import merge from 'merge-stream';
import fs from 'fs';
import logger from '../utils/logger.js';



// Potlačení varování v node procesu pomocí přepsání console.warn
const originalWarn = console.warn;
logger.warn = function (message) {
  if (typeof message === 'string' && (
      message.includes('Deprecation') ||
      message.includes('deprecated') ||
      message.includes('legacy') ||
      message.includes('@import')
    )) {
    // Ignoruj varování o zastaralosti
    return;
  }
  originalWarn.apply(console, arguments);
};

// Use create require for CommonJS modules
const require = createRequire(
  import.meta.url);
// Použijeme sass s tichým režimem pro varování
const sass = require('gulp-sass')(require('sass'));
// Použijeme glob jako CommonJS modul - oprava chyby importu
const glob = require('glob');

/**
 * Compiles SASS files to CSS
 * @param {string|Array} src - Source files or glob patterns
 * @param {string} dest - Destination directory
 * @param {string} outputFilename - Output filename
 * @param {Array} postcssPlugins - PostCSS plugins
 * @param {Object} options - Additional options
 * @returns {NodeJS.ReadWriteStream} - Gulp stream
 */
export default function compileSass(src, dest, outputFilename,
  postcssPlugins = [], options = {}) {

  // Přidáme debug informace pro lepší řešení problémů
  logger.debug(`SASS Compilation: ${src} -> ${dest}/${outputFilename}`);

  // Kontrola, zda zdrojové soubory existují
  const sources = Array.isArray(src) ? src : [src];
  sources.forEach(source => {
    if (!glob.sync(source).length) {
      logger.warn(`Warning: No files found matching ${source}`);
    } else {
      logger.debug(`Found source files for ${source}`);
    }
  });

  // Vytvoření adresáře pro minifikované soubory
  const minDir = `${dest}/min`;
  if (!fs.existsSync(minDir)) {
    fs.mkdirSync(minDir, {
      recursive: true
    });
  }

  const {
    cb = null
  } = options;
  const postcssPluginsFinal = postcssPlugins || [autoprefixer(), pixrem()];
  const postcssPluginsMin = [...postcssPluginsFinal, cssnano()];

  // Nastavení pro potlačení varování
  const sassOptions = {
    quietDeps: true,
    outputStyle: 'expanded',
    logger: {
      warn: function (message) {
        // Filtrování varování obsahujících klíčová slova
        if (message.includes('Deprecation') ||
          message.includes('deprecated') ||
          message.includes('legacy')) {
          return;
        }
        logger.warn('SASS Warning:', message);
      },
      debug: function () {}
    }
  };

  // Compile expanded CSS
  const expandedStream = gulp
    .src(src)
    .pipe(sourcemaps.init())
    .pipe(sass(sassOptions).on('error', function (error) {
      // Vlastní handler, který ignoruje varování
      if (error.messageType !== 'deprecation') {
        logger.warn(error.messageFormatted);
      }
      this.emit('end');
    }))
    .pipe(postcss(postcssPluginsFinal))
    .pipe(concat(outputFilename))
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest(dest));

  // Compile minified CSS
  const minifiedStream = gulp
    .src(src)
    .pipe(sourcemaps.init())
    .pipe(sass(sassOptions).on('error', function (error) {
      // Vlastní handler, který ignoruje varování
      if (error.messageType !== 'deprecation') {
        logger.error(error.messageFormatted);
      }
      this.emit('end');
    }))
    .pipe(postcss(postcssPluginsMin))
    .pipe(concat(outputFilename.replace('.css', '.min.css')))
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest(`${dest}/min`));

  // Použití merge-stream pro zpracování obou streamů současně
  if (cb) {
    return merge(expandedStream, minifiedStream)
      .on('end', function () {
        cb();
      });
  }

  return expandedStream;
}
