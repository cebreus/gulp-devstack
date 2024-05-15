const { exec } = require('child_process');
const fs = require('fs');
const gulp = require('gulp');
const log = require('fancy-log');
const replace = require('gulp-replace');
const through2 = require('through2');
const todo = require('gulp-todo');

/**
 * Builds a TODO.md file by scanning JavaScript, CSS, SCSS, and Markdown files for TODO comments.
 * @param {object} params - Optional parameters for the buildTodo function.
 * @param {Function} params.cb - Callback function to be executed after the TODO file is created.
 * @param {boolean} params.verbose - Flag indicating whether to log verbose output.
 * @returns {void} - Gulp stream that generates the TODO.md file.
 * @throws {Error} - If the callback parameter is not a function.
 */

const buildTodo = (params = {}) => {
  let todoExist = false;
  const filePath = './TODO.md';
  const cb = params.cb || (() => {});

  if (typeof cb !== 'function') {
    throw new Error('Callback in params should be of type function.');
  }

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    log('         Existing TODO.md file deleted.');
  }

  return gulp
    .src(['**/*.{js,css,scss,md}', '!node_modules/**'])
    .pipe(todo())
    .pipe(replace('### ', '# '))
    .pipe(
      through2.obj(function processFile(file, _, callback) {
        if (file.todos?.length) {
          todoExist = true;
          this.push(file);
        }
        callback();
      }),
    )
    .pipe(gulp.dest('./'))
    .on('end', async () => {
      if (!todoExist) {
        log('         No TODOs found.');
        cb();
        return;
      }

      try {
        await exec(
          `npx remark-cli -q ${filePath} -o -- && git add ${filePath}`,
        );
        if (params.verbose) {
          log('         ToDos created.');
        }
      } catch (error) {
        log.error(`exec error: ${error}`);
      }
      cb();
    });
};

module.exports = buildTodo;
