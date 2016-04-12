var gulp = require('gulp');
var shelljs = require('shelljs');
var runSequence = require('run-sequence');
var mergeStream = require('merge-stream');
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
    'desktop-app/bower_components/moment/min/moment.min.js',
    'desktop-app/bower_components/mousetrap/mousetrap.min.js',
    'desktop-app/bower_components/ngAutocomplete/src/ngAutocomplete.js',
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
['win32', 'osx64', 'linux32', 'linux64'].forEach(function(platform) {
  return gulp.task('build:' + platform, function() {
    var nw = new nwBuilder({
      files: 'desktop-app/**',
      platforms: [platform],
      version: '0.12.3',
      appName: appName,
      buildDir: buildDir,
      cacheDir: 'cache',
      appVersion: appPkg.version,
      winIco: process.argv.indexOf('--noicon') > 0 ? void 0 : './assets-windows/icon.ico',
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

// Package for Linux
[32, 64].forEach(function(arch) {
  return ['deb', 'rpm'].forEach(function(target) {
    return gulp.task("pack:linux" + arch + ":" + target, ['build:linux' + arch], function() {
      var move_opt;
      shelljs.rm('-rf', './build/linux');
      shelljs.mkdir('-p', './build/linux');
      move_opt = gulp.src(['./assets-linux/after-install.sh', './assets-linux/after-remove.sh', './build/tinder-desktop/linux' + arch + '/**']).pipe(gulp.dest('./build/linux/opt/tinder-desktop'));
      return mergeStream(move_opt).on('end', function() {
        var output, port;
        shelljs.cd('./build/linux');
        port = arch === 32 ? 'i386' : 'x86_64';
        output = "../../dist/tinder-desktop_linux" + arch + "." + target;
        shelljs.mkdir('-p', '../../dist');
        shelljs.rm('-f', output);
        shelljs.exec("fpm -s dir -t " + target + " -a " + port + " --rpm-os linux -n tinder-desktop --after-install ./opt/tinder-desktop/after-install.sh --after-remove ./opt/tinder-desktop/after-remove.sh --license ISC --category Chat --url \"https://github.com/tinderjs/tinder-desktop\" --description \"A cross-platform desktop Tinder client\" -p " + output + " -v " + appPkg.version + " .");
        return shelljs.cd('../..');
      });
    });
  });
});

// Package all platforms
gulp.task('pack:all', ['clean'], function(callback) {
  runSequence('pack:osx64', 'pack:win32', 'pack:linux32:deb', 
              'pack:linux64:deb', callback);
});

// Default task is to package for all platforms
gulp.task('default', ['pack:all']);
