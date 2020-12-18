const fs = require('fs');
const gulp = require('gulp');
const gulpif = require('gulp-if');
const data = require('gulp-data');
const inject = require('gulp-inject');
const nunjucksRender = require('gulp-nunjucks-render');
const plumber = require('gulp-plumber');
const prettify = require('gulp-jsbeautifier');
const replace = require('gulp-replace');
const rename = require('gulp-rename');

/**
 * @description Compile Nunjucks templates and replaces variable from JSON
 * @param {string} input Path with filter to source files
 * @param {string} output Path to save compiled files
 * @param {string} dataSource Input file/path with data structure
 * @param {string} rename Custom name of file
 * @param {string} injectCss Path to css files which you want inject
 * @param {array} injectJs Path to JS files which you want inject
 * @param {array} injectCdnJs Path to CDN JS files which you want inject
 * @return {stream} Compiled file
 */

const buildHtml = (params) => {
  const dateFilter = require('nunjucks-date-filter-locale');
  const localeSettings = require(`.${params.siteConfig}`);
  dateFilter.setLocale(localeSettings.meta.lang);

  let existsJson = false;
  let findJson = true;
  let currentFile = '';
  let renameCondition = params.rename ? true : false;
  let oldDataSource = '';

  if (params.dataSource.includes('.json')) {
    if (typeof params.dataSource !== 'object') {
      params.dataSource = [params.dataSource];
    }

    params.dataSource.forEach((element) => {
      try {
        fs.accessSync(element);
        existsJson = true;
        findJson = false;
      } catch (error) {
        console.log(`buildHtml(): JSON file ${element} doesn't exists.`);
        existsJson = false;
        findJson = false;
      }
    });
  } else {
    let existsJson = false;
    let findJson = true;
  }

  nunjucksRender.nunjucks.configure(params.templates, {
    watch: false,
    lstripBlocks: true,
    throwOnUndefined: true,
    trimBlocks: true,
    stream: true,
  });

  return (
    gulp
      .src(params.input)
      .pipe(plumber())
      .pipe(
        rename((path) => {
          currentFile = path;
          if (currentFile.dirname !== '.') {
            const file = JSON.parse(
              fs.readFileSync(
                `${process.cwd()}/${params.dataSource}/${
                  currentFile.dirname
                }.json`,
                'utf-8'
              )
            );
            oldDataSource = currentFile.dirname;
            if (file.seo.slug) {
              currentFile.dirname = file.seo.slug;
            }
          }
        })
      )
      // Add acces to site configuration
      .pipe(
        data(function () {
          let file = params.siteConfig;
          file = {
            SITE: {
              ...JSON.parse(fs.readFileSync(file)),
            },
          };
          return file;
        })
      )
      .pipe(
        gulpif(
          existsJson,
          data(function () {
            let file;
            params.dataSource.forEach((element) => {
              file = {
                ...file,
                ...JSON.parse(fs.readFileSync(element)),
              };
            });
            return file;
          })
        )
      )
      .pipe(
        gulpif(
          findJson,
          data(function () {
            if (currentFile.dirname === '.') {
              return JSON.parse(
                fs.readFileSync(
                  `${process.cwd()}/${params.dataSource}/index.json`
                )
              );
            } else {
              const file = JSON.parse(
                fs.readFileSync(
                  `${process.cwd()}/${params.dataSource}/${oldDataSource}.json`
                )
              );
              return file;
            }
          })
        )
      )
      .pipe(
        nunjucksRender({
          path: params.processPaths,
          manageEnv: (enviroment) => {
            enviroment.addFilter('date', dateFilter);
            enviroment.addGlobal('toDate', function (date) {
              return date ? new Date(date) : new Date();
            });
          },
        })
      )
      .pipe(
        inject(gulp.src(params.injectCss, { read: false }), {
          relative: false,
          ignorePath: params.injectIgnorePath,
          addRootSlash: true,
          removeTags: true,
        })
      )
      .pipe(
        inject(gulp.src(params.injectJs, { read: false }), {
          relative: false,
          ignorePath: params.injectIgnorePath,
          addRootSlash: true,
          removeTags: true,
        })
      )
      .pipe(
        replace(
          '<!-- inject: bootstrap js -->',
          params.injectCdnJs.toString().replace(/[, ]+/g, ' ')
        )
      )
      .pipe(replace(/^(\s*\r?\n){2,}/gm, ''))
      .pipe(prettify())
      .pipe(
        gulpif(
          renameCondition,
          rename({
            dirname: '/',
            basename: params.rename,
            extname: '.html',
          })
        )
      )
      .pipe(gulp.dest(params.output))
      .on('end', params.cb)
  );
};

module.exports = buildHtml;
