var gulp = require('gulp');
var appPkg = require('./desktop-app/package.json');
var electron = require('electron-prebuilt');
var mergeStream = require('merge-stream');
var proc = require('child_process');
var removeNPMAbsolutePaths = require('removeNPMAbsolutePaths');
var runSequence = require('run-sequence');
var shelljs = require('shelljs');
var packager = require('electron-packager');
var $ = require('gulp-load-plugins')();

var buildDir = './build';

// Remove build output directories
gulp.task('clean', function() {
  shelljs.rm('-rf', buildDir);
  shelljs.rm('-rf', './dist');
  removeNPMAbsolutePaths('./desktop-app/node_modules');
});

// Build for all platforms
['darwin', 'linux', 'win32'].forEach(function(platform) {
  var arch = ['ia32', 'x64'];
  // Only x64 on darwin
  if(platform == 'darwin') arch = ['x64'];

  arch.forEach(function(arch) {
    return gulp.task('build:' + platform + ':' + arch, function(callback) {
      var icon = null;

      if(platform == 'darwin') {
        icon = './assets-osx/icon.icns';
      } else if(platform == 'win32') {
        icon = './assets-windows/icon.ico';
      };

      var opts = {
        platform: platform,
        arch: arch,
        asar: true,
        download: {
          cache: './cache'
        },
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
});

// Package .dmg for OS X
gulp.task('pack:darwin:x64', ['build:darwin:x64'], function(callback) {
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
    return gulp.task('pack:linux:' + arch + ':' + target, function() {
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
  runSequence('build:darwin:x64', 'build:win32:all', 'build:linux:all',
              callback);
});

// Build all Windows archs
gulp.task('build:win32:all', function(callback) {
  runSequence('build:win32:ia32', 'build:win32:x64', callback);
});

// Build all Linux archs
gulp.task('build:linux:all', function(callback) {
  runSequence('build:linux:ia32', 'build:linux:x64', callback);
});

// Build and package all Linux archs
gulp.task('pack:linux:all', ['build:linux:all'], function(callback) {
  runSequence('pack:linux:ia32:deb', 'pack:linux:ia32:rpm',
              'pack:linux:x64:deb', 'pack:linux:x64:rpm', callback);
})

// Build and package all Windows archs
gulp.task('pack:win32:all', ['build:win32:all'], function(callback) {
  runSequence('pack:win32:ia32', 'pack:win32:x64', callback);
})

// Build and package all platforms
gulp.task('pack:all', [], function(callback) {
  runSequence('pack:darwin:x64', 'pack:win32:all',
              'pack:linux:all', callback);
});

// Run Tinder Desktop in debug mode
gulp.task('run', [], function(callback) {
  var child = proc.spawn(electron, ['--enable-logging', '--debug=5858', './desktop-app']);

  child.stdout.on('data', function(data) {
    console.log('stdout: ' + data);
  });

  child.stderr.on('data', function(data) {
    console.log('stderr: ' + data);
  });

  child.on('exit', function(exitCode) {
    console.log('Exited with code: ' + exitCode);
    return callback(exitCode === 1 ? new Error('Error running run task') : null);
  });
});

// Default task is to run Tinder Desktop in debug mode
gulp.task('default', ['run']);
