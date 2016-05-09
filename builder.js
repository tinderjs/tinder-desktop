var electronInstaller = require('electron-winstaller');

// resultPromise = electronInstaller.createWindowsInstaller({
//   appDirectory: '/tmp/build/my-app-64',
//   outputDirectory: '/tmp/build/installer64',
//   authors: 'My App Inc.',
//   exe: 'myapp.exe'
// });

resultPromise = electronInstaller.createWindowsInstaller({
  appDirectory: 'build/Tinder\ Desktop-win32-x64',
  outputDirectory: './build/windows',
  authors: 'Tinder JS',
  exe: 'Tinder\ Desktop.exe',
  description: 'Tinder Desktop',
  title: 'Tinder Desktop'
});

resultPromise.then(() => console.log("It worked!"), (e) => console.log(`${e.message}`));



