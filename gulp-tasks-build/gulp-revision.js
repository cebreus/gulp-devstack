const gulp = require('gulp');
const rev = require('gulp-rev');
const revRewrite = require('gulp-rev-rewrite');
const revReplace = require('gulp-rev-replace');
const revDelete = require('gulp-rev-delete-original');

const revision = (params) => {
    return gulp
        .src(params.inputRevision)
        .pipe(rev())
        .pipe(revReplace())
        .pipe(revDelete())
        .pipe(gulp.dest(params.outputRevision))
        .pipe(rev.manifest())
        .pipe(gulp.dest(params.ouputManifest))
        .pipe(gulp.src(params.inputRewrite))
        .pipe(revRewrite(params.manifestFile))
        .pipe(gulp.dest(params.outputRewrite));
};

module.exports = revision;
