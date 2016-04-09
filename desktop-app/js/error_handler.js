// source: https://github.com/nwjs/nw.js/issues/1699#issuecomment-84861481

/*------------ Uncaught Nodejs Error prevent and Logger-----------*/

// clean exceptions from a previous load (refresh case)
if (process._events.uncaughtException.length > 0) {
  process._events.uncaughtException.splice(0, 1);
}

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

  alert('Sorry, something went wrong, please restart the app (or try downloading latest version from tinderplusplus.com)');
  return false;
});

// Clean Buggy thing
if (process._events.uncaughtException.length > 1 
  && !!process._events.uncaughtException[0].toString().match(/native code/)) {
  process._events.uncaughtException.splice(0, 1);
}

/*------------ Uncaught Nodejs Error prevent and Logger-----------*/
