import gulp from 'gulp';

import { exec } from 'child_process';
import log from 'fancy-log';
import fs from 'fs';
import replace from 'gulp-replace';
import todo from 'gulp-todo';
import through2 from 'through2';

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

export default buildTodo;
