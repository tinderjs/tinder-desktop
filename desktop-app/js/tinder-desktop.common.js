(function() {
  var module = angular.module('tinder-desktop.common', []);
  
  module.controller('MenuController', function($scope) {
    $scope.getCookie = function(cookieName) {
      return localStorage[cookieName];
    };
  });
  
  module.filter('distanceToUnits', function(Settings) {
    return function(distanceMi) {
      if (Settings.get('distanceUnits') == 'mi') {
        return distanceMi + ' mi';
      } else {
        return Math.round(distanceMi * 1.60934) + ' km';
      }
    };
  });

  module.filter('bdayToAge', function() {
    return function(bday) {
      return moment.duration(moment().diff(moment(bday))).years();
    };
  });

  module.filter('timeFromNow', function() {
    return function(time) {
      return moment(time).fromNow();
    };
  });

  module.filter('timeToLocalized', function () {
    return function(time) {
      return moment(time).format('L HH:mm');
    };
  });
})();
