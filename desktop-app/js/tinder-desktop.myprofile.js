(function() {
  module = angular.module('tinder-desktop.myprofile', ['ngAutocomplete', 'ngSanitize']);

  module.controller('MyProfileController', function($scope, $timeout, $interval, API) {
    $scope.DiscoverySettings = {};
    API.getAccount().then(function(response){
      $scope.DiscoverySettings.age_filter_max = response.user.age_filter_max;
      $scope.DiscoverySettings.age_filter_min = response.user.age_filter_min;
      $scope.DiscoverySettings.discoverable = response.user.discoverable;
      $scope.DiscoverySettings.gender_filter = response.user.gender_filter;
      $scope.DiscoverySettings.distance_filter = response.user.distance_filter;
    });

    $scope.updateDiscoverySettings = function() {
      API.updatePreferences($scope.DiscoverySettings.discoverable, $scope.DiscoverySettings.age_filter_min
        , $scope.DiscoverySettings.age_filter_max, parseInt($scope.DiscoverySettings.gender_filter)
        , $scope.DiscoverySettings.distance_filter)
        .then(function(){
          console.log('ok');
      });
    };


  });
})();
