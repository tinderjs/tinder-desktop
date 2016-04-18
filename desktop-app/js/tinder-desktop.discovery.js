(function() {
  module = angular.module('tinder-desktop.discovery', ['ngAutocomplete','ngRangeSlider', 'ngSanitize']);

  module.controller('DiscoveryController', function($scope, $timeout, $interval, API) {
    
    $scope.DiscoverySettings = {
      age_filter : {
        from: 0,
        to: 0
      }
    };
    
    fetchDiscoverySettings();
    
    $scope.updateDiscoverySettings = function() {
      API.updatePreferences(Boolean(parseInt($scope.DiscoverySettings.discoverable)), $scope.DiscoverySettings.age_filter.from
        , $scope.DiscoverySettings.age_filter.to, parseInt($scope.DiscoverySettings.gender_filter)
        , parseInt($scope.DiscoverySettings.distance_filter))
        .then(function(){
          console.log('Preferences updated');
      });
    };
    
    $scope.autocompleteOptions = {
      types: '(cities)'
    };
    
    $scope.watchAutocomplete = function () { return $scope.details; };
    
    $scope.$watch($scope.watchAutocomplete, function (details) {
      if (details) {
        var fuzzAmount = +(Math.random() * (0.0000009 - 0.0000001) + 0.0000001);
        var lng = (parseFloat(details.geometry.location.lng()) + fuzzAmount).toFixed(7);
        var lat = (parseFloat(details.geometry.location.lat()) + fuzzAmount).toFixed(7);
        API.updatePassport(lat, lng).then(function(){
          fetchDiscoverySettings();
        });
      }
    }, true);
  
    $scope.$on('$locationChangeStart', function(event, next, current) {
      $scope.updateDiscoverySettings();
    });
    
    $scope.resetPassport = function(){
      API.resetPassport().then(function(){
        fetchDiscoverySettings();
      });
    }
    
    function fetchDiscoverySettings() {
      API.getAccount().then(function(response){
        $scope.DiscoverySettings.discoverable = response.user.discoverable ? '1' : '0';
        $scope.DiscoverySettings.gender_filter = response.user.gender_filter;
        $scope.DiscoverySettings.distance_filter = response.user.distance_filter;
        $scope.DiscoverySettings.age_filter = { from: response.user.age_filter_min, to: response.user.age_filter_max };
        $scope.DiscoverySettings.is_traveling = response.travel.is_traveling;
        
        if(response.travel.is_traveling){
          var tl = response.travel.travel_location_info[0];
          $scope.DiscoverySettings.currentLocation = tl.locality.short_name + ', ' + tl.street_number.short_name + ' ' + tl.route.short_name;
        }
        
      });
    }
    
  });
})();
