import gulp from 'gulp';
import changed from 'gulp-changed';
import autoprefixer from 'autoprefixer-core';
import browserify from 'browserify';
import watchify from 'watchify';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import eslint from 'gulp-eslint';
import babelify from 'babelify';
import uglify from 'gulp-uglify';
import del from 'del';
import notify from 'gulp-notify';
import browserSync, {reload} from 'browser-sync';
import sourcemaps from 'gulp-sourcemaps';
import postcss from 'gulp-postcss';
import nested from 'postcss-nested';
import vars from 'postcss-simple-vars';
import extend from 'postcss-simple-extend';
import cssnano from 'cssnano';
import htmlReplace from 'gulp-html-replace';
import image from 'gulp-image';
import runSequence from 'run-sequence';

const p = {
  bundle: 'app.js',
  srcJsx: 'src/app.jsx',
  srcCss: 'src/**/*.css',
  dist: 'dist',
  distJs: 'dist/js',
  distcss: 'dist/css',
  distImg: 'dist/img'
};

gulp.task('clean', cb => {
  del(['dist'], cb);
});

gulp.task('browserSync', () => {
  browserSync({
    server: {
      baseDir: './'
    }
  });
});

gulp.task('watchify', () => {
  let bundler = watchify(browserify(p.srcJsx, watchify.args));

  function rebundle() {
    return bundler
      .bundle()
      .on('error', notify.onError())
      .pipe(source(p.bundle))
      .pipe(gulp.dest(p.distJs))
      .pipe(reload({stream: true}));
  }

  bundler.transform(babelify)
  .on('update', rebundle);
  return rebundle();
});

gulp.task('browserify', () => {
  browserify(p.srcJsx)
  .transform(babelify)
  .bundle()
  .pipe(source(p.bundle))
  .pipe(buffer())
  .pipe(sourcemaps.init())
  .pipe(uglify())
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest(p.distJs));
});

gulp.task('styles', () => {
  gulp.src(p.srcCss)
  .pipe(sourcemaps.init())
  .pipe(postcss([vars, extend, nested, autoprefixer, cssnano]))
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest(p.dist))
  .pipe(reload({stream: true}));
});

gulp.task('htmlReplace', () => {
  gulp.src('index.html')
  .pipe(htmlReplace({css: 'styles/main.css', js: 'js/app.js'}))
  .pipe(gulp.dest(p.dist));
});

gulp.task('images', () => {
  gulp.src('img/**')
  .pipe(image())
  .pipe(gulp.dest(p.distImg));
});

gulp.task('lint', () => {
  gulp.src(p.srcJsx)
  .pipe(eslint())
  .pipe(eslint.format());
});

gulp.task('watchTask', () => {
  gulp.watch(p.scss, ['styles']);
  gulp.watch(p.srcJsx, ['lint']);
});

gulp.task('watch', cb => {
  runSequence('clean', ['browserSync', 'watchTask', 'watchify', 'styles', 'lint', 'images'], cb);
});

gulp.task('build', cb => {
  process.env.NODE_ENV = 'production';
  runSequence('clean', ['browserify', 'styles', 'htmlReplace', 'images'], cb);
});

gulp.task('default', () => {
  console.log('Run "gulp watch or gulp build"');
});
