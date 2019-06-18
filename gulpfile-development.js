const gulp = require("gulp");

const compileSassFnc = require("./gulp-tasks-development/gulp-compile-sass");
const concatFilesFnc = require("./gulp-tasks-development/gulp-concat-files");
const fixCssFnc = require("./gulp-tasks-development/gulp-css-fix");
const lintCssFnc = require("./gulp-tasks-development/gulp-css-lint");

// Variables
// --------------

const config = require("./gulpconfig-development");

// Gulp functions
// --------------

function compileSassCore() {
  return compileSassFnc(
    config.sassCore,
    config.sassBuild,
    "bootstrap.css",
    config.postcssPluginsBase
  );
}

function compileSassCustom() {
  return compileSassFnc(
    config.sassCustom,
    config.sassBuild,
    "custom.css",
    config.postcssPluginsBase
  );
}

function compileSassUtils() {
  return compileSassFnc(
    config.sassUtils,
    config.sassBuild,
    "utils.css",
    config.postcssPluginsBase
  );
}

function lintCss(done) {
  lintCssFnc(config.sassAll);
  //console.log("\n\n");
  //lintCssPropsFnc(config.sassAll);
  //console.log("\n\n");
  //lintCssColorsFnc(config.sassAll);
  done();
}

function fixCss(done) {
  fixCssFnc(config.sassAll, config.sassBase);
  done();
}

// Gulp tasks
// --------------

gulp.task(
  "build:css",
  gulp.parallel(compileSassCore, compileSassCustom, compileSassUtils)
);
gulp.task("cssfix", fixCss);
gulp.task("csslint", lintCss);

// Aliases

gulp.task("default", gulp.series("build:css"));
