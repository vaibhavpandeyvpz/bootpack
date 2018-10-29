const gulp = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const connect = require('gulp-connect');
const cssnano = require('gulp-cssnano');
const data = require('gulp-data');
const del = require('del');
const extreplace = require('gulp-ext-replace');
const frontmatter = require('front-matter');
const gulpif = require('gulp-if');
const log = require('gulplog');
const nunjucks = require('gulp-nunjucks');
const plumber = require('gulp-plumber');
const sass = require('gulp-sass');
const tilde = require('node-sass-tilde-importer');
const using = require('gulp-using');
const watch = require('gulp-watch');

const PRODUCTION = process.env.NODE_ENV === 'production';

const plumberr = function(error) {
  log.error(error);
  this.emit('end')
};

gulp.task('build', ['css', 'html']);

gulp.task('clean', function () {
  return del('build/**/*')
});

gulp.task('css', function() {
  return gulp.src(['sources/styles/*.scss', '!sources/styles/_*.scss'])
    .pipe(plumber(plumberr))
    .pipe(sass({importer: tilde}))
    .pipe(autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }))
    .pipe(gulpif(PRODUCTION, cssnano()))
    .pipe(gulp.dest('build/css'))
    .pipe(using({
      filesize: true,
      prefix: 'Saved '
    }))
    .pipe(connect.reload())
});

gulp.task('html', function() {
  return gulp.src(['sources/views/*.njk', '!sources/views/_*.njk'])
    .pipe(plumber(plumberr))
    .pipe(data(function(file) {
      const content = frontmatter(String(file.contents));
      file.contents = new Buffer(content.body);
      return content.attributes
    }))
    .pipe(nunjucks.compile())
    .pipe(extreplace('.html', '.html.njk'))
    .pipe(gulp.dest('build'))
    .pipe(using({
      filesize: true,
      prefix: 'Saved '
    }))
    .pipe(connect.reload())
});

gulp.task('serve', ['build', 'watch'], function() {
  connect.server({
    livereload: true,
    root: 'build'
  });
});

gulp.task('watch', function() {
  watch('sources/**/*', function(vinyl) {
    if (vinyl.path.endsWith('css')) {
      gulp.start(['css'])
    } else if (vinyl.path.endsWith('njk')) {
      gulp.start(['html'])
    }
  })
});
