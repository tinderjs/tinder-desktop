// TODO: automate updating desktop-app/package.json version
console.log('Before running, make sure versions are updated in both package.json and desktop-app/package.json');

var NwBuilder = require('node-webkit-builder');
var appPkg = require('./desktop-app/package.json');

var nw = new NwBuilder({
  files: 'desktop-app/**',
  platforms: ['osx32', 'win32'],
  version: '0.11.6',
  appName: 'Tinder⁺⁺',
  appVersion: appPkg.version,
  winIco: 'icons/win.ico',
  macIcns: 'icons/mac.icns',
  buildType: 'versioned',
  mergeZip: false
});

nw.on('log', console.log);

nw.build().then(function () {
  console.log('all done!');
}).catch(function (error) {
  console.error(error);
});

// create the regular .nw file for updates
console.log('creating regular tinder.nw for updates...');
var fs = require('fs');
var archiver = require('archiver');
var archive = archiver('zip');
var updatesDir = './build/updates';

if (!fs.existsSync(updatesDir)){
  fs.mkdirSync(updatesDir);
}

var output = fs.createWriteStream(updatesDir + '/tinder-' + appPkg.version + '.nw');
output.on('close', function () {
  console.log((archive.pointer() / 1000000).toFixed(2) + 'mb compressed');
});

archive.pipe(output);
archive.bulk([
  { expand: true, cwd: 'desktop-app', src: ['**'], dest: '.' }
]);
archive.finalize();


// INSTRUCTIONS FOR BUILDING INSTALLER:
// MAC
// npm install -g appdmg
// appdmg dmg.json build/tinder.dmg

// WINDOWS
// Inno Setup Compiler
// Enigma Virtual Box
