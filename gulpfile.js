var gulp = require('gulp');
var shelljs = require('shelljs');
var runSequence = require('run-sequence');
var mergeStream = require('merge-stream');
var packager = require('electron-packager');
var appPkg = require('./desktop-app/package.json');
var $ = require('gulp-load-plugins')();

var buildDir = './build';

// File paths to various assets are defined here.
var PATHS = {
  javascript: [
    'bower_components/angular/angular.min.js',
    'bower_components/angular-cookies/angular-cookies.min.js',
    'bower_components/angular-route/angular-route.min.js',
    'bower_components/angular-sanitize/angular-sanitize.min.js',
    'bower_components/jquery/dist/jquery.min.js',
    'bower_components/moment/min/moment.min.js',
    'bower_components/mousetrap/mousetrap.min.js',
    'bower_components/ngAutocomplete/src/ngAutocomplete.js',
    'bower_components/twemoji/twemoji.min.js'
  ],
  stylesheets: [
    'bower_components/font-awesome/css/font-awesome.min.css'
  ],
  fonts: [
    'bower_components/font-awesome/fonts/*.{eot,svg,ttf,woff,woff2}'
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
gulp.task('compile', ['scripts', 'stylesheets', 'fonts']);

// Remove build output directories
gulp.task('clean', function() {
  shelljs.rm('-rf', buildDir);
  shelljs.rm('-rf', './dist');
});

// Build for all platforms
['darwin', 'linux', 'win32'].forEach(function(platform) {
  return gulp.task('build:' + platform, function(callback) {
    var icon = null;

    if(platform == 'darwin') {
      icon = './assets-osx/icon.icns';
    } else if(platform == 'win32') { 
      icon = './assets-windows/icon.ico';
    };

    var opts = {
      platform: platform,
      arch: 'all',
      asar: true,
      cache: './cache',
      dir: './desktop-app',
      icon: icon,
      out: buildDir,
      overwrite: true,
      'app-version': appPkg.version
    };

    packager(opts, function done_callback (err, appPaths) {
      if(err) { return console.log(err); }
      callback();
    });

  });
});

// Package .dmg for OS X
gulp.task('pack:darwin:x64', function(callback) {
  if(process.platform !== 'darwin') {
    console.warn('Skipping darwin x64 packaging: must be on OS X.');
    return callback();
  }

  shelljs.mkdir('-p', './dist/darwin');
  shelljs.rm('-f', './dist/darwin/Tinder Desktop.dmg');

  return gulp.src([]).pipe($.appdmg({
    source: './assets-osx/dmg.json',
    target: './dist/darwin/Tinder Desktop.dmg'
  }));
});

// Package installer .exe for Windows
['ia32', 'x64'].forEach(function(arch) {
  gulp.task('pack:win32:' + arch, function(callback) {
    return gulp.src('./assets-windows/installer-script-' + arch + '.iss')
      .pipe($.inno());
  });
});

// Package for Linux
['ia32', 'x64'].forEach(function(arch) {
  return ['deb', 'rpm'].forEach(function(target) {
    return gulp.task("pack:linux:" + arch + ":" + target, function() {
      var move_opt;
      shelljs.rm('-rf', buildDir + '/linux');
      shelljs.mkdir('-p', buildDir + '/linux');
      move_opt = gulp.src(['./assets-linux/after-install.sh', './assets-linux/after-remove.sh', buildDir + '/tinder-desktop/linux' + arch + '/**']).pipe(gulp.dest(buildDir + '/linux/opt/tinder-desktop'));
      return mergeStream(move_opt).on('end', function() {
        var output, port;
        shelljs.cd(buildDir + '/linux');
        port = arch === 'ia32' ? 'i386' : 'x86_64';
        output = "../../dist/linux/tinder-desktop-" + arch + "." + target;
        shelljs.mkdir('-p', '../../dist/linux');
        shelljs.rm('-f', output);
        shelljs.exec("fpm -s dir -t " + target + " -a " + port + " --rpm-os linux -n tinder-desktop --after-install ./opt/tinder-desktop/after-install.sh --after-remove ./opt/tinder-desktop/after-remove.sh --vendor \"tinderjs\" --license ISC --category Chat --url \"https://github.com/tinderjs/tinder-desktop\" --description \"A cross-platform desktop Tinder client\" -m \"Stuart Williams <stuart@sidereal.ca>\" -p " + output + " -v " + appPkg.version + " .");
        return shelljs.cd('../..');
      });
    });
  });
});

// Build all platforms
gulp.task('build:all', ['clean'], function(callback) {
  runSequence('build:darwin', 'build:win32', 'build:linux', callback);
});

// Package all Linux platforms
gulp.task('pack:linux:all', function(callback) {
  runSequence('pack:linux:ia32:deb', 'pack:linux:ia32:rpm', 
              'pack:linux:x64:deb', 'pack:linux:x64:rpm', callback);
})

// Package all Windows platforms
gulp.task('pack:win32:all', function(callback) {
  runSequence('pack:win32:ia32', 'pack:win32:x64', callback);
})

// Package all platforms
gulp.task('pack:all', function(callback) {
  runSequence('build:all', 'pack:darwin:x64', 'pack:win32:all', 
              'pack:linux:all', callback);
});

// Default task is to package for all platforms
gulp.task('default', ['compile', 'pack:all']);
