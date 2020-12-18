const fs = require('fs');
const gulp = require('gulp');
const data = require('gulp-data');
const mergeJson = require('gulp-merge-json');
const path = require('path');
const plumber = require('gulp-plumber');

/**
 * @description Merge JSON files into one; each file in new node
 * @param {string, object} input Path with filter to source files
 * @param {string} output Path to save processed files
 * @param {string} outputFilename Output file name
 * @return {stream} Processed file
 */

const datasetBuild = (input, output, outputFilename, cb) => {
  return gulp
    .src(input)
    .pipe(
      mergeJson({
        fileName: outputFilename,
        concatArrays: true,
        mergeArrays: false,
        edit: (json, file) => {
          let data = {};
          let fileName = path.parse(file.path).name;
          let fileDir = path.parse(file.path).dir;

          if (fileName === 'site') {
            let primaryKey = fileName;
            data[primaryKey.toUpperCase()] = json;
          } else if (fileDir.includes('dataset-')) {
            let primaryKey = fileDir
              .split(path.sep)
              .pop()
              .replace('_dataset-', '');
            data[primaryKey.toUpperCase()] = [json].sort(
              (a, b) => new Date(b['startDate']) - new Date(a['startDate'])
            );
          }
          return data;
        },
      })
    )
    .pipe(gulp.dest(output))
    .on('end', cb);
};

module.exports = datasetBuild;
