const {
  series,
  src,
  dest,
  watch,
  parallel
} = require("gulp");
const sass = require('gulp-sass');
const concat = require('gulp-concat');
const autoprefixer = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const nunjucksRender = require("gulp-nunjucks-render");
const browserSync = require("browser-sync");
browserSync.create();

sass.compiler = require('node-sass');

// JavaScript source file order (for concatenation)
const jsSources = [
  './src/js/module.js',
  './src/js/index.js'
]

function copy() {
  return src('./src/assets/*.+(png|jpg|gif|jpeg)')
    .pipe(dest('./dist/assets/'))
}

/* 
  * Standard Nunjucks script:
  * - Run when the default `gulp` script is run
    - Looks for files in the './src/pages/' folder
    - Runs it thorough the nunjucks function
    - Inlines css
    - and outputs the results here './dist/'
    - streams changes to browser-sync instance invoked by the `gulp` script
*/

function nunjucks() {
  return src('./src/pages/*.+(html|nunjucks|njk)')
    .pipe(
      nunjucksRender({
        path: ["./src/templates"]
      }))
    .pipe(dest('./dist'))
    .pipe(browserSync.stream());
}

// * Converts sass to css
function sassFn() {
  return src('./src/scss/styles.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(dest('./dist/'))
    .pipe(browserSync.stream());
}

// * Processes JavaScript
function scriptsFn() {
  return src(jsSources)
    .pipe(sourcemaps.init())
    .pipe(concat('index.js'))
    .pipe(babel({
      presets: ['@babel/env']
    }))
    .pipe(sourcemaps.write())
    .pipe(dest('./dist/'))
}

// * Creates a browsersync instance
function browser_sync(done) {
  browserSync.init({
    server: {
      baseDir: "./dist",
      index: "index.html"
    }
  });
  done();
}

// * Watches for file changes in `src` folder
function watchFiles() {
  watch(
    [
      './src/scss/**/*.scss',
      './src/js/*.js',
      './src/**/*.+(html|nunjucks|njk)'
    ], series(sassFn, scriptsFn, nunjucks))
  watch('./src/assets/*.+(png|jpg|gif|jpeg)', copy)
}

// Default gulp variable
// * represents the `gulp` command
const watchFn = series(sassFn, scriptsFn, nunjucks, parallel(watchFiles, browser_sync));

exports.default = watchFn;

exports.copy = copy;