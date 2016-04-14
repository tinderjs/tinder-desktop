(function() {
  // resize to window to full screen height
  var resizeToHeight = Math.min(820, window.screen.availHeight);
  window.resizeTo(window.innerWidth, resizeToHeight);

  var gui = require('nw.gui');
  var win = gui.Window.get();

  if (process.platform === 'darwin') {
    var nativeMenuBar = new gui.Menu({ type: 'menubar' });
    nativeMenuBar.createMacBuiltin('Tinder⁺⁺', {
      hideEdit: false
    });
    win.menu = nativeMenuBar;
  }

  var app = angular.module('tinder-desktop', ['tinder-desktop.login', 'tinder-desktop.swipe', 'tinder-desktop.messages', 'tinder-desktop.profile','tinder-desktop.discovery', 'ngRoute', 'tinder-desktop.settings', 'tinder-desktop.controls', 'tinder-desktop.common']);

  app.config(function($routeProvider) {
    var capitalize = function (s) { return s[0].toUpperCase() + s.slice(1); };

    ['/login', '/swipe/', '/messages', '/profile/:userId', '/settings', '/discovery'].forEach(function(route) {
      var name = route.split('/')[1];
      $routeProvider.when(route, {
        templateUrl: 'templates/'  + name + '.html',
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
