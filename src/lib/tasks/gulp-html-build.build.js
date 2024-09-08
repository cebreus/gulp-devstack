import gulp from 'gulp';

import { readJson } from '../../helpers.js';
import log from 'fancy-log';
import fs from 'fs';
import data from 'gulp-data';
import minify from 'gulp-htmlmin';
import gulpif from 'gulp-if';
import inject from 'gulp-inject';
import nunjucksRender from 'gulp-nunjucks-render';
import plumber from 'gulp-plumber';
import rename from 'gulp-rename';
import replace from 'gulp-replace';
import dateFilter from 'nunjucks-date-filter-locale';
import markdown from 'nunjucks-markdown-filter';
import process from 'process';
import { Stream } from 'stream';

/**
 * Builds HTML files based on the provided parameters.
 * @param {object} params - The build parameters.
 * @param {string} params.siteConfig - The path to the site configuration file.
 * @param {string|string[]} params.dataSource - The path(s) to the data source file(s).
 * @param {string} params.templates - The path to the templates directory.
 * @param {string} params.input - The input file(s) to process.
 * @param {string} params.injectCss - The path to the CSS file(s) to inject.
 * @param {string} params.injectIgnorePath - The path to ignore when injecting CSS.
 * @param {string[]} params.injectCdnJs - The CDN URLs for JavaScript injection.
 * @param {string} params.injectJs - The path to the JavaScript file(s) to inject.
 * @param {string[]} params.processPaths - The paths to process.
 * @param {string} params.output - The output directory.
 * @param {string} params.rename - The new name for the output file(s).
 * @param {Function} params.cb - The callback function to execute on completion.
 * @returns {Stream} - The Gulp stream.
 */
const buildHtml = (params) => {
  const localeSettings = readJson(params.siteConfig);
  const renameCondition = !!params.rename;
  dateFilter.setLocale(localeSettings.meta.lang);
  let currentFile = '';
  let existsJson = false;
  let findJson = true;
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
        log.error(`buildHtml(): JSON file ${element} doesn't exists.`);
        existsJson = false;
        findJson = false;
      }
    });
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
                `${process.cwd()}/${params.dataSource}/${currentFile.dirname
                }.json`,
                'utf8',
              ),
            );
            oldDataSource = currentFile.dirname;
            if (file.seo.slug) {
              currentFile.dirname = file.seo.slug;
            }
          }
        }),
      )
      // Add access to site configuration
      .pipe(
        data(() => {
          let file = params.siteConfig;
          file = {
            SITE: {
              ...JSON.parse(fs.readFileSync(file)),
            },
          };
          return file;
        }),
      )
      .pipe(
        gulpif(
          existsJson,
          data(() => {
            let file;
            params.dataSource.forEach((element) => {
              file = {
                ...file,
                ...JSON.parse(fs.readFileSync(element)),
              };
            });
            return file;
          }),
        ),
      )
      .pipe(
        gulpif(
          findJson,
          data(() => {
            if (currentFile.dirname === '.') {
              return JSON.parse(
                fs.readFileSync(
                  `${process.cwd()}/${params.dataSource}/index.json`,
                ),
              );
            }
            const file = JSON.parse(
              fs.readFileSync(
                `${process.cwd()}/${params.dataSource}/${oldDataSource}.json`,
              ),
            );
            return file;
          }),
        ),
      )
      .pipe(
        nunjucksRender({
          data: { SOURCE: process.env.SOURCE },
          path: params.processPaths,
          manageEnv: (enviroment) => {
            enviroment.addFilter('date', dateFilter);
            enviroment.addFilter('md', markdown);
            enviroment.addFilter(
              'unique',
              (arr) =>
                (arr instanceof Array &&
                  arr.filter((e, i, arr1) => arr1.indexOf(e) === i)) ||
                arr,
            );
            enviroment.addGlobal('toDate', (date) => {
              return date ? new Date(date) : new Date();
            });
          },
        }),
      )
      .pipe(
        inject(
          gulp.src(params.injectCss, {
            read: false,
          }),
          {
            relative: false,
            ignorePath: params.injectIgnorePath,
            addRootSlash: true,
            removeTags: true,
            quiet: true,
          },
        ),
      )
      .pipe(replace(/(href=["'])(\/assets)/g, '$1.$2'))
      .pipe(
        replace(
          '<!-- inject: bootstrap js -->',
          params.injectCdnJs.toString().replace(/[, ]+/g, ' '),
        ),
      )
      .pipe(
        inject(
          gulp.src(params.injectJs, {
            read: false,
          }),
          {
            relative: false,
            ignorePath: params.injectIgnorePath,
            addRootSlash: true,
            removeTags: true,
            transform(filepath) {
              // Performance optimisation on local JS libraries on end of <body>
              return `<script defer src="${filepath}"></script>`;
            },
          },
        ),
      )
      // Improve acessibility of basic tables
      .pipe(replace(/<th>/g, '<th scope="col">'))
      // Remove multi/line comments
      .pipe(replace(/( )*<!--((.*)|[^<]*|[^!]*|[^-]*|[^>]*)-->\n*/g, ''))
      .pipe(
        minify({
          collapseWhitespace: true,
          collapseBooleanAttributes: true,
        }),
      )
      .pipe(
        gulpif(
          renameCondition,
          rename({
            dirname: '/',
            basename: params.rename,
            extname: '.html',
          }),
        ),
      )
      .pipe(gulp.dest(params.output))
      .on('end', () => {
        params.cb();
      })
  );
};

export default buildHtml;
