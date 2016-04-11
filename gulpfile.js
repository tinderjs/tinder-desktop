var gulp = require('gulp');
var shelljs = require('shelljs');
var runSequence = require('run-sequence');
var nwBuilder = require('nw-builder');
var removeNPMAbsolutePaths = require('removeNPMAbsolutePaths');
var appPkg = require('./desktop-app/package.json');
var $ = require('gulp-load-plugins')();

var appName = 'tinder-desktop';
var buildDir = 'build';

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
