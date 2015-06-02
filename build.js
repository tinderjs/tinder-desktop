var NwBuilder = require('node-webkit-builder');
var appPkg = require('./desktop-app/package.json');

var nw = new NwBuilder({
  files: 'desktop-app/**',
  platforms: ['osx32', 'osx64', 'win32', 'win64'],
  version: '0.11.2',
  appName: 'Tinder⁺⁺',
  appVersion: appPkg.version,
  winIco: 'icons/win.ico',
  macIcns: 'icons/mac.icns',
  buildType: 'timestamped',
  macZip: true
});

nw.on('log', console.log);

nw.build().then(function () {
  console.log('all done!');
}).catch(function (error) {
  console.error(error);
});
