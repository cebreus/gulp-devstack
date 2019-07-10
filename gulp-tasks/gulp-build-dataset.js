const fs = require('fs');
const gulp = require('gulp');
const data = require('gulp-data');
const mergeJson = require('gulp-merge-json');
const path = require('path');
const plumber = require('gulp-plumber');

/**
 * @description Merge JSON files into one; each file in new node
 * @param {string,object} input Path with filter to source files
 * @param {string} output Path to save processed files
 * @param {string} outputFilename Output file name
 * @return {stream} Processed file
 */

const buildDataset = (input, output, outputFilename, cb) => {
  return gulp
    .src(input)
    .pipe(
      mergeJson({
        fileName: outputFilename,
        edit: (json, file) => {
          let filename = path.basename(file.path),
            primaryKey = filename.replace(path.extname(filename), '');
          let data = {};
          data[primaryKey.toUpperCase()] = json;
          return data;
        }
      })
    )
    .pipe(gulp.dest(output))
    .on('end', cb);
};

module.exports = buildDataset;
