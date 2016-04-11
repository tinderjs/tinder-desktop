var gulp = require('gulp');
var shelljs = require('shelljs');
var runSequence = require('run-sequence');
var nwBuilder = require('nw-builder');
var removeNPMAbsolutePaths = require('removeNPMAbsolutePaths');
var appPkg = require('./desktop-app/package.json');
var $ = require('gulp-load-plugins')();

var appName = 'tinder-desktop';
var buildDir = 'build';

// File paths to various assets are defined here.
var PATHS = {
  javascript: [
    'desktop-app/bower_components/angular/angular.min.js',
    'desktop-app/bower_components/angular-cookies/angular-cookies.min.js',
    'desktop-app/bower_components/angular-route/angular-route.min.js',
    'desktop-app/bower_components/angular-sanitize/angular-sanitize.min.js',
    'desktop-app/bower_components/jquery/dist/jquery.min.js',
    'desktop-app/bower_components/mousetrap/mousetrap.min.js',
    'desktop-app/bower_components/ngAutocomplete/src/ngAutocomplete.js',
    'desktop-app/bower_components/swing/dist/swing.min.js',
    'desktop-app/bower_components/twemoji/twemoji.min.js'
  ],
  stylesheets: [
    'desktop-app/bower_components/font-awesome/css/font-awesome.min.css'
  ],
  fonts: [
    'desktop-app/bower_components/font-awesome/fonts/*.{eot,svg,ttf,woff,woff2}'
  ]
};

// JavaScript assets handler
gulp.task('scripts', function() {
  shelljs.rm('-rf', './desktop-app/js/vendor');
  return gulp.src(PATHS.javascript)
    .pipe(gulp.dest('desktop-app/js/vendor'));
});

// Stylesheet assets handler
gulp.task('stylesheets', function() {
  return gulp.src(PATHS.stylesheets)
    .pipe(gulp.dest('desktop-app/css'));
});

// Fonts assets handler
gulp.task('fonts', function() {
  return gulp.src(PATHS.fonts)
    .pipe(gulp.dest('desktop-app/fonts'));
});

// Assets handler
gulp.task('assets', ['scripts', 'stylesheets', 'fonts']);

// Remove build output directories
gulp.task('clean', function() {
  shelljs.rm('-rf', './build');
  shelljs.rm('-rf', './dist');
});

// Build for all platforms
['win32', 'osx64'].forEach(function(platform) {
  return gulp.task('build:' + platform, function() {
    var nw = new nwBuilder({
      files: 'desktop-app/**',
      platforms: [platform],
      version: '0.12.3',
      appName: appName,
      buildDir: buildDir,
      cacheDir: 'cache',
      appVersion: appPkg.version,
      winIco: './assets-windows/icon.ico',
      macIcns: './assets-osx/icon.icns',
      mergeZip: false
    });

    nw.on('log', function(msg) {
      if (msg.indexOf('Zipping') !== 0) console.log(msg)
    });

    return nw.build()
    .then(function () {
      removeNPMAbsolutePaths(buildDir);
    })
    .catch(function (error) {
      console.error(error);
    });

  });
});

// Package .dmg for OS X
gulp.task('pack:osx64', ['build:osx64'], function(callback) {
  shelljs.mkdir('-p', './dist');
  shelljs.rm('-f', './dist/Tinder Desktop.dmg');

  return gulp.src([]).pipe($.appdmg({
    source: './assets-osx/dmg.json',
    target: './dist/Tinder Desktop.dmg'
  }));
});

// Package installer .exe for Windows
gulp.task('pack:win32', ['build:win32'], function(callback) {
  return gulp.src('./assets-windows/installer-script.iss').pipe($.inno());
});

// Package all platforms
gulp.task('pack:all', ['clean'], function(callback) {
  runSequence('pack:osx64', 'pack:win32', callback);
});

// Default task is to package for all platforms
gulp.task('default', ['pack:all']);
