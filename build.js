// TODO: automate updating desktop-app/package.json version
console.log('Before running, make sure versions are updated in both package.json and desktop-app/package.json');

var NwBuilder = require('node-webkit-builder');
var appPkg = require('./desktop-app/package.json');
var appName = 'Tinder++';

var nw = new NwBuilder({
  files: 'desktop-app/**',
  platforms: ['osx32', 'win32'],
  version: '0.12.3',
  appName: appName,
  appVersion: appPkg.version,
  winIco: 'icons/win.ico',
  macIcns: 'icons/mac.icns',
  buildType: 'default',
  mergeZip: false
});

nw.on('log', console.log);

nw.build()
  .then(function () {
    console.log('done building apps');
    createDMG();
    createNW();
  })
  .catch(function (error) {
    console.error(error);
  });

// create the regular .nw file for updates
function createNW() {
  console.log('creating regular tinder.nw for updates...');
  var fs = require('fs');
  var archiver = require('archiver');
  var archive = archiver('zip');

  var output = fs.createWriteStream('./build/' + appName + '/tinder-' + appPkg.version + '.nw');
  output.on('close', function () {
    console.log((archive.pointer() / 1000000).toFixed(2) + 'mb compressed');
  });

  archive.pipe(output);
  archive.bulk([
    { expand: true, cwd: 'desktop-app', src: ['**'], dest: '.' }
  ]);
  archive.finalize();
}


// create the mac DMG installer
function createDMG() {
  console.log('creating mac dmg...');
  var appdmg = require('appdmg');
  var ee = appdmg({
    source: './dmg.json',
    target: './build/' + appName + '/Tinder++.dmg'
  });
   
  ee.on('progress', function (info) {
   
    // info.current is the current step 
    // info.total is the total number of steps 
    // info.type is on of 'step-begin', 'step-end' 
   
    // 'step-begin' 
    // info.title is the title of the current step 
   
    // 'step-end' 
    // info.status is one of 'ok', 'skip', 'fail' 
    console.log('DMG step ' + info.current + '/' + info.total);
   
  });
   
  ee.on('finish', function () {
    console.log('mac dmg created');
  });
   
  ee.on('error', function (err) {
    console.log(err);
  });
}


// WINDOWS
// Inno Setup Compiler
// Enigma Virtual Box
