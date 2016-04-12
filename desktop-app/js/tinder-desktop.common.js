(function() {
  var module = angular.module('tinder-desktop.common', []);

  module.filter('distanceToUnits', function(Settings) {
    return function(distanceMi) {
      if (Settings.get('distanceUnits') == 'mi') {
        return distanceMi + ' mi';
      } else {
        return Math.round(distanceMi * 1.60934) + ' km';
      }
    };
  });
})();
