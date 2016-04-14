(function() {
  module = angular.module('tinder-desktop.discovery', ['ngRangeSlider', 'ngSanitize']);

  module.controller('DiscoveryController', function($scope, $timeout, $interval, API) {
    $scope.DiscoverySettings = {
      age_filter : {
        from: 0,
        to: 0
      }
    };
    API.getAccount().then(function(response){
      $scope.DiscoverySettings.discoverable = response.user.discoverable ? '1' : '0';
      $scope.DiscoverySettings.gender_filter = response.user.gender_filter;
      $scope.DiscoverySettings.distance_filter = response.user.distance_filter;
      $scope.DiscoverySettings.age_filter = { from: response.user.age_filter_min, to: response.user.age_filter_max };
    });

    $scope.updateDiscoverySettings = function() {
      API.updatePreferences(Boolean(parseInt($scope.DiscoverySettings.discoverable)), $scope.DiscoverySettings.age_filter.from
        , $scope.DiscoverySettings.age_filter.to, parseInt($scope.DiscoverySettings.gender_filter)
        , parseInt($scope.DiscoverySettings.distance_filter))
        .then(function(){
          console.log('Preferences updated');
      });
    };

    $scope.$on('$locationChangeStart', function(event, next, current) {
      $scope.updateDiscoverySettings();
    });



  });
})();
