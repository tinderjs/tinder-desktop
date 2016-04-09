(function() {
  // resize to window to full screen height
  var resizeToHeight = Math.min(900, window.screen.availHeight);
  window.resizeTo(window.innerWidth, resizeToHeight);

  var gui = require('nw.gui');
  var win = gui.Window.get();

  if (process.platform === 'darwin') {
    var nativeMenuBar = new gui.Menu({ type: 'menubar' });
    nativeMenuBar.createMacBuiltin('Tinder++', {
      hideEdit: false
    });
    win.menu = nativeMenuBar;
  }

  var app = angular.module('tinder++', ['tinder++.login', 'tinder++.swipe', 'tinder++.messages', 'tinder++.profile', 'ngRoute', 'tinder++.settings', 'tinder++.controls']);

  app.config(function($routeProvider) {
    var capitalize = function (s) { return s[0].toUpperCase() + s.slice(1); };

    ['/login', '/swipe/', '/messages', '/profile/:userId', '/settings'].forEach(function(route) {
      var name = route.split('/')[1];
      $routeProvider.when(route, {
        templateUrl: name + '.html',
        controller: capitalize(name) + 'Controller'
      });
    });
  });

  app.run(function($location, Settings, Controls) {
    var firstPage = (localStorage.tinderToken ? Settings.get('landingPage') : '/login');
    $location.path(firstPage);
    Controls.init();
  });
})();
