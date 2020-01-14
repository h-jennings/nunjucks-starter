const {
  series,
  src,
  dest,
  watch,
  parallel
} = require("gulp");
const rename = require("gulp-rename");
const gulpif = require("gulp-if")
const del = require("del");
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const nunjucksRender = require("gulp-nunjucks-render");
const browserSync = require("browser-sync");
const browserify = require("browserify");
const babelify = require("babelify");
const source = require("vinyl-source-stream");
const buffer = require("vinyl-buffer");
const sourcemaps = require("gulp-sourcemaps");
const uglify = require("gulp-uglify");

browserSync.create();

sass.compiler = require('node-sass');

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

// * Cleans dist folder
function clean() {
  return del(['dist/**'])
}

// * Processes JavaScript

// JavaScript source file order (for concatenation)
const jsSourceFile = 'index.js';
const jsSourceFolder = './src/js/'

// dev mode, switch to 'false' for production (uglification)
const dev = true;

function processJS() {
  return browserify({
      entries: [jsSourceFolder + jsSourceFile],
      debug: true
    })
    .transform(babelify, {
      presets: ["@babel/preset-env"],
      sourceMaps: true
    })
    .bundle()
    .pipe(source(jsSourceFile))
    .pipe(rename({
      basename: 'bundle'
    }))
    .pipe(buffer())
    .pipe(sourcemaps.init({
      loadMaps: true
    }))
    // if production environment, then uglify code else
    .pipe(gulpif(!dev, uglify()))
    .pipe(sourcemaps.write('./'))
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
    ], series(clean, sassFn, processJS, nunjucks))
  watch('./src/assets/*.+(png|jpg|gif|jpeg)', series(clean, copy))
}

// Default gulp variable
// * represents the `gulp` command
const watchFn = series(clean, sassFn, processJS, nunjucks, parallel(watchFiles, browser_sync));

exports.default = watchFn;

exports.copy = copy;
exports.clean = clean;