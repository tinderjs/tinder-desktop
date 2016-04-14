(function() {
  var app = angular.module('tinder-desktop', ['tinder-desktop.login', 'tinder-desktop.swipe', 'tinder-desktop.messages', 'tinder-desktop.profile','tinder-desktop.myprofile', 'ngRoute', 'tinder-desktop.settings', 'tinder-desktop.controls', 'tinder-desktop.common']);

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
