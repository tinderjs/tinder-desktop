(function() {
  // resize to window to full screen height
  var resizeToHeight = Math.min(820, window.screen.availHeight);
  window.resizeTo(window.innerWidth, resizeToHeight);

  var gui = require('nw.gui');
  var win = gui.Window.get();

  if (process.platform === 'darwin') {
    var nativeMenuBar = new gui.Menu({ type: 'menubar' });
    nativeMenuBar.createMacBuiltin('Tinder⁺⁺', {
      hideEdit: true
    });
    win.menu = nativeMenuBar;
  }


  var app = angular.module('tinder++', ['tinder++.login', 'tinder++.swipe', 'ngRoute']);

  app.config(function($routeProvider) {
    var capitalize = function (s) { return s[0].toUpperCase() + s.slice(1); };

    ['login', 'swipe'].forEach(function(route) {
      $routeProvider.when('/' + route, {
        templateUrl: route + '.html',
        controller: capitalize(route) + 'Controller'
      });
    });
  });

  app.run(function($location) {
    var firstPage = (localStorage.tinderToken ? '/swipe' : '/login');
    $location.path(firstPage);
  });
})();
