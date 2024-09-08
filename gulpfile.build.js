import { parallel, series, task } from 'gulp';

import * as config from './src/lib/constants/gulpconfig.build.js';

import cssCompileFnc from './src/lib/tasks/gulp-compile-sass.build.js';
import htmlBuildFnc from './src/lib/tasks/gulp-html-build.build.js';
import jsProcessFnc from './src/lib/tasks/gulp-process-js.build.js';
import cssPurgeFnc from './src/lib/tasks/gulp-purgecss.build.js';
import revisionFnc from './src/lib/tasks/gulp-revision.build.js';
import replaceHashFnc from './src/lib/tasks/gulp-sri-hash.build.js';
import cleanFnc from './src/lib/tasks/gulp-clean.js';
import copyStaticFnc from './src/lib/tasks/gulp-copy-static.js';
import datasetPrepareFnc from './src/lib/tasks/gulp-dataset-prepare.js';
import deployFtpFnc from './src/lib/tasks/gulp-deploy-ftp.js';
import faviconsFnc from './src/lib/tasks/gulp-favicons.js';
import fontLoadFnc from './src/lib/tasks/gulp-font-load.js';
import htmlValidateFnc from './src/lib/tasks/gulp-html-validate.js';
import {
  optimizeJpg,
  optimizePng,
  optimizeSvg,
} from './src/lib/tasks/gulp-optimize-images.js';
import { error } from 'fancy-log';
import { readFileSync, rename, unlink, unlinkSync, writeFileSync } from 'fs';


// Variables
// --------------

const showLogs = false;

// Gulp functions
// --------------

/**
 * Cleans the folders specified in the `config.buildBase` variable.
 * @returns {Promise} A promise that resolves when the folders are cleaned.
 */
function cleanFolders() {
  return cleanFnc([config.tempBase, config.buildBase]);
}

/**
 * Copies static files from the source directory to the build directory.
 * @param {Function} done - Callback function to be called when the copying is complete.
 * @returns {Promise} - A promise that resolves when the copying is complete.
 */
function copyStatic(done) {
  return copyStaticFnc(
    [`${config.staticBase}/*`, `${config.staticBase}/**/*`, `${config.staticBase}/.*/*`],
    config.staticBase,
    config.buildBase,
    {
      verbose: showLogs,
      cb: () => {
        done();
      },
    },
  );
}

/**
 * Validates HTML files.
 * @param {Function} done - Callback function to be called when the validation is complete.
 * @returns {Promise} A promise that resolves when the HTML files are validated.
 */
function htmlValidate(done) {
  return htmlValidateFnc(`${config.buildBase}/**/*.html`, {
    verbose: showLogs,
    cb: () => {
      done();
    },
  });
}

/**
 * Deploys files to FTP server.
 * @param {Function} done - Callback function to be called when deployment is complete.
 * @returns {Promise} - A promise that resolves when the deployment is complete.
 */
function deployFtp(done) {
  return deployFtpFnc(`${config.buildBase}/**`, `${config.buildBase}/`, '.', {
    verbose: showLogs,
    cb: () => {
      done();
    },
  });
}

// SASS

/**
 * Compiles Sass core files.
 * @param {Function} done - Callback function to be called when the compilation is done.
 * @returns {object} - The result of the cssCompileFnc function.
 */
function compileSassAll(done) {
  return cssCompileFnc(
    config.sassAll,
    config.sassBuild,
    'index.min.css',
    config.postcssPluginsBase,
    {
      verbose: showLogs,
      cb: () => {
        done();
      },
    },
  );
}

/**
 * Purges unused CSS from the specified files and directories.
 * @param {Function} done - The callback function to be called when the purge is complete.
 * @returns {object} - The result of the purge operation.
 */
function purgecss(done) {
  return cssPurgeFnc(
    [`${config.buildBase}/**/*index*.css`],
    [`${config.buildBase}/**/*.html`],
    config.buildBase,
    {
      cb: () => {
        done();
      },
    },
  );
}

// JS

/**
 * Processes JavaScript files.
 * @param {Function} done - Callback function to be called when processing is complete.
 * @returns {void}
 */
function processJs(done) {
  const params = {
    concatFiles: true,
    outputConcatPrefixFileName: 'app',
    cb: () => {
      done();
    },
  };

  return jsProcessFnc(config.jsFiles, config.jsBuild, params);
}

// Dataset

/**
 * Prepares the dataset for the site.
 * @param {Function} done - The callback function to be called when the dataset preparation is complete.
 * @returns {Promise} A promise that resolves when the dataset preparation is complete.
 */
function datasetPrepareSite(done) {
  return datasetPrepareFnc(`${config.contentBase}/site.md`, config.tempBase, {
    verbose: showLogs,
    cb: () => {
      done();
    },
  });
}

/**
 * Prepares dataset pages.
 * @param {Function} done - The callback function to be called when the dataset pages are prepared.
 * @returns {void}
 */
function datasetPreparePages(done) {
  return datasetPrepareFnc(config.datasetPagesSource, config.datasetPagesBuild, {
    verbose: showLogs,
    cb: () => {
      done();
    },
  });
}

// Templates

/**
 * Builds the pages using the specified parameters.
 * @param {Function} done - The callback function to be called when the build is complete.
 * @returns {object} - The result of the htmlBuildFnc function.
 */
function buildPages(done) {
  const params = {
    input: `${config.tplPagesBase}/**/*.html`,
    output: config.tplBuild,
    templates: config.tplTemplatesBase,
    processPaths: [config.tplPagesBase, config.tplTemplatesBase],
    siteConfig: `${config.tempBase}/site.json`,
    dataSource: config.datasetPagesBuild,
    injectCdnJs: config.injectCdnJs,
    injectJs: config.injectJs,
    injectCss: config.injectCss,
    injectIgnorePath: config.buildBase.replace('./', ''),
    cb: () => {
      done();
    },
  };

  return htmlBuildFnc(params);
}

// GFX

/**
 * Optimizes images in different formats (jpg, png, svg).
 * @param {Function} done - Callback function to be called when the task is complete.
 * @returns {Function} - The callback function passed as a parameter.
 */
function images(done) {
  const params = {
    verbose: showLogs,
    cb: () => {
      done();
    },
  };

  optimizeJpg(config.imagesJpg, config.gfxBuild, params);
  optimizePng(config.imagesPng, config.gfxBuild, params);
  optimizeSvg(config.imagesSvg, config.gfxBuild, params);
  return done();
}

// Favicons

/**
 * Generate favicons and perform necessary file operations.
 * @param {Function} done - Callback function to be called when the task is done.
 * @returns {void}
 */
function favicons(done) {
  return faviconsFnc(config.faviconSourceFile, config.faviconBuild, {
    config: config.faviconGenConfig,
    verbose: showLogs,
    cb: () => {
      done();

      // Move `favicon.ico` to project root
      rename(
        `${config.faviconBuild}/favicon.ico`,
        `${config.buildBase}/favicon.ico`,
        (err) => {
          if (err) throw err;
        },
      );

      // Move `favicons.njk` and edit file content
      readFileSync(`${config.faviconBuild}/favicons.njk`, 'utf8', (err, data) => {
        if (err) throw err;

        // Remove link to moved `favicon.ico`
        const newValue = data.replace(/<link rel="shortcut icon[^>]*>/g, '');

        writeFileSync(
          `${config.tplTemplatesBase}/partials/favicons.njk`,
          newValue,
          'utf8',
          (err2) => {
            if (err2) {
              throw err;
            } else {
              // log('Done!');

              try {
                unlinkSync(`${config.faviconBuild}/favicons.njk`);
                // log('Removed!');
              } catch (err3) {
                error(err3);
              }
            }
          },
        );
      });
    },
  });
}

// Fonts

/**
 * Loads fonts using the specified configuration.
 * @param {Function} done - The callback function to be called when the font loading is complete.
 * @returns {void}
 */
function fontLoad(done) {
  return fontLoadFnc(config.fontloadFile, config.tempBase, {
    config: config.fontLoadConfig,
    verbose: showLogs,
    cb: () => {
      copyStaticFnc(
        `${config.tempBase}/assets/font/*`,
        `${config.tempBase}/assets/font`,
        `${config.buildBase}/assets/font`,
        {
          cb: () => {
            done();
          },
        },
      );
    },
  });
}

/**
 * Replaces the hash in HTML files within the build directory.
 * @param {Function} done - The callback function to be called when the task is complete.
 * @returns {Promise} - A promise that resolves when the hash replacement is done.
 */
function replaceHash(done) {
  return replaceHashFnc(`${config.buildBase}/**/*.html`, config.buildBase, {
    verbose: showLogs,
    cb: () => {
      done();
    },
  });
}

/**
 * Performs revisioning of CSS and JS files and rewriting of HTML files.
 * @param {Function} done - The callback function to be called when the revisioning is complete.
 * @returns {Promise} A promise that resolves when the revisioning is complete.
 */
function revision(done) {
  const params = {
    inputRevision: [`${config.buildBase}/**/*.css`, `${config.buildBase}/**/*.js`],
    inputRewrite: `${config.buildBase}/**/*.html`,
    outputRevision: config.buildBase,
    outputRewrite: config.buildBase,
    ouputManifest: `${config.tempBase}/revision`,
    cb: () => {
      done();
    },
  };

  return revisionFnc(params);
}

/**
 * Performs post-build tasks.
 * @param {Function} done - Callback function to be called when post-build tasks are completed.
 */
function postbuild(done) {
  unlink(`${config.buildBase}/assets/favicons/favicons.njk`, (err) => {
    if (err) {
      error(err);
    }
  });
  // htmlValidate();
  done();
}
// Gulp tasks
// --------------

task('css', compileSassAll);

task('js', processJs);

task('dataset', parallel(datasetPrepareSite, datasetPreparePages));

task('html', series(datasetPrepareSite, datasetPreparePages, buildPages));

task('images', images);

task('fonts', fontLoad);

task('validate', htmlValidate);

task(
  'build',
  series(
    cleanFolders,
    images,
    copyStatic,
    datasetPrepareSite,
    datasetPreparePages,
    favicons,
    fontLoad,
    compileSassAll,
    processJs,
    buildPages,
    purgecss,
    revision,
    replaceHash,
    htmlValidate,
    postbuild,
  ),
);

task('deployFtp', series('build', deployFtp));

// Aliases

task('default', series('build'));
