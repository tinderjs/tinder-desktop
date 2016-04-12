process.on('uncaughtException', function(e) {
  console.group('Node uncaughtException');
  if (!!e.message) {
    console.log(e.message);
  }
  if (!!e.stack) {
    console.log(e.stack);
  }
  console.log(e);
  console.groupEnd();

  alert('Sorry, something went wrong, please restart the app (or try downloading latest version from github.com/tinderjs/tinder-desktop)');
  return false;
});
