const fs = require('fs');
const gulp = require('gulp');
const path = require('path');

const cleanFnc = require('./gulp-tasks/gulp-clean');
const copyStaticFnc = require('./gulp-tasks/gulp-copy-static');
const cssCompileFnc = require('./gulp-tasks-export/gulp-compile-sass');
const cssPurgeFnc = require('./gulp-tasks-build/gulp-purgecss');
const datasetPrepareFnc = require('./gulp-tasks/gulp-dataset-prepare');
const faviconsFnc = require('./gulp-tasks/gulp-favicons');
const fontLoadFnc = require('./gulp-tasks/gulp-font-load');
const htmlBuildFnc = require('./gulp-tasks-export/gulp-html-build');
const htmlValidateFnc = require('./gulp-tasks/gulp-html-validate');
const imagesOptimizeFnc = require('./gulp-tasks/gulp-optimize-images');
const jsProcessFnc = require('./gulp-tasks-export/gulp-process-js');

const replaceHashFnc = require('./gulp-tasks-build/gulp-sri-hash');
const revisionFnc = require('./gulp-tasks-build/gulp-revision');

// Variables
// --------------

const config = require('./gulpconfig-export');

const sleep = (waitTimeInMs = 0) =>
  new Promise((resolve) => setTimeout(resolve, waitTimeInMs));

// Gulp functions
// --------------

function cleanFolders() {
  return cleanFnc([config.tempBase, config.buildBase]);
}

function cleanFolderTemp() {
  return cleanFnc([config.tempBase]);
}

function copyStatic(done) {
  sleep().then(() => {
    return copyStaticFnc('./static/**/*', './static', config.buildBase, () => {
      done();
    });
  });
}

function htmlValidate() {
  return htmlValidateFnc(`${config.buildBase}/**/*.html`);
}

// SASS

function compileSassAll() {
  return cssCompileFnc(
    config.sassAll,
    config.sassBuild,
    'index.min.css',
    config.postcssPluginsBase
  );
}

function purgecss(done) {
  sleep().then(() => {
    return cssPurgeFnc(
      [`${config.buildBase}/**/*.css`],
      [`${config.buildBase}/**/*.html`],
      config.buildBase,
      () => {
        done();
      }
    );
  });
}

// JS

function processJs() {
  return jsProcessFnc(config.jsFiles, config.jsBuild, {
    concatFiles: true,
    outputConcatPrefixFileName: 'app',
  });
}

// Dataset

function datasetPrepareSite(done) {
  sleep().then(() => {
    datasetPrepareFnc(`${config.contentBase}/site.md`, config.tempBase, () => {
      done();
    });
  });
}

function datasetPreparePages(done) {
  sleep().then(() => {
    datasetPrepareFnc(
      config.datasetPagesSource,
      config.datasetPagesBuild,
      () => {
        done();
      }
    );
  });
}

// Templates

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

  sleep().then(() => {
    htmlBuildFnc(params);
  });
}

// GFX

function images(done) {
  sleep().then(() => {
    imagesOptimizeFnc.optimizeJpg(config.imagesJpg, config.gfxBuild);
  });
  sleep().then(() => {
    imagesOptimizeFnc.optimizePng(config.imagesPng, config.gfxBuild);
  });
  sleep().then(() => {
    imagesOptimizeFnc.optimizeSvg(config.imagesSvg, config.gfxBuild);
  });
  done();
}

// Favicons

function favicons(done) {
  sleep().then(() => {
    return faviconsFnc(
      config.faviconSourceFile,
      config.faviconBuild,
      config.faviconGenConfig,
      () => {
        // Move `favicon.ico` to project root
        fs.rename(
          `${config.faviconBuild}/favicon.ico`,
          `${config.buildBase}/favicon.ico`,
          function (err) {
            if (err) throw err;
          }
        );

        // Move `favicons.njk` and edit file content
        fs.readFile(
          `${config.faviconBuild}/favicons.njk`,
          'utf-8',
          function (err, data) {
            if (err) throw err;

            // Remove link to moved `favicon.ico`
            let newValue = data.replace(/<link rel="shortcut icon[^>]*>/g, '');

            fs.writeFile(
              `${config.tplTemplatesBase}/partials/favicons.njk`,
              newValue,
              'utf-8',
              function (err, data) {
                if (err) {
                  throw err;
                } else {
                  // console.log('Done!');

                  // Remove temp `favicons.njk`
                  try {
                    fs.unlinkSync(`${config.faviconBuild}/favicons.njk`);
                    // console.log('Removed!');
                  } catch (err) {
                    console.error(err);
                  }
                }
              }
            );
          }
        );
      }
    );
  });
  done();
}

// Fonts

function fontLoad(done) {
  sleep().then(() => {
    fontLoadFnc(
      config.fontloadFile,
      config.tempBase,
      config.fontLoadConfig,
      () => {
        copyStaticFnc(
          `${config.tempBase}/assets/font/**/*`,
          `${config.tempBase}/assets/font`,
          `${config.buildBase}/assets/font`,
          () => {
            done();
          }
        );
      }
    );
  });
}

function replaceHash(done) {
  sleep().then(() => {
    return replaceHashFnc(
      `${config.buildBase}/**/*.html`,
      config.buildBase,
      () => {
        done();
      }
    );
  });
}

function revision(done) {
  const params = {
    inputRevision: [
      `${config.buildBase}/**/*.css`,
      `${config.buildBase}/**/*.js`,
    ],
    inputRewrite: `${config.buildBase}/**/*.html`,
    outputRevision: config.buildBase,
    outputRewrite: config.buildBase,
    ouputManifest: `${config.tempBase}/revision`,
    cb: () => {
      done();
    },
  };

  sleep().then(() => {
    return revisionFnc(params);
  });
}

// Gulp tasks
// --------------

gulp.task('css', compileSassAll);

gulp.task('js', processJs);

gulp.task('dataset', gulp.parallel(datasetPrepareSite, datasetPreparePages));

gulp.task(
  'html',
  gulp.series(datasetPrepareSite, datasetPreparePages, buildPages)
);

gulp.task('images', images);

gulp.task('fonts', fontLoad);

gulp.task('validate', htmlValidate);

gulp.task(
  'export',
  gulp.series(
    cleanFolders,
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
    images,
    cleanFolderTemp
  )
);

// Aliases

gulp.task('default', gulp.series('export'));
