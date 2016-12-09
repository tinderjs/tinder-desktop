(function() {
  module = angular.module('tinder-desktop.discovery', ['ngAutocomplete','ngRangeSlider', 'ngSanitize']);
  
  module.controller('DiscoveryController', function($scope, $translate, $timeout, $interval, API, Cache) {
    
    var change = 0;
    $scope.Discovery = {
      age_filter : {
        from: 0,
        to: 0
      }
    };
    
    if(Cache.get('account')){
      fillDiscovery();
    }
    
    API.getAccount().then(function(res){
      fillDiscovery();
    });

    function fillDiscovery(){
      var res = Cache.get('account');
      $scope.Discovery.discoverable = res.user.discoverable ? '1' : '0';
      $scope.Discovery.gender_filter = res.user.gender_filter;
      $scope.Discovery.distance_filter = res.user.distance_filter;
      $scope.Discovery.age_filter = { from: res.user.age_filter_min, to: res.user.age_filter_max };
      $scope.Discovery.is_traveling = res.travel.is_traveling;
      $scope.Discovery.tinder_plus = (res.purchases.length == 0)? false : true;
      
      if(res.travel.is_traveling){
        var tl = res.travel.travel_location_info[0];
        $scope.Discovery.currentLocation = tl.locality.short_name + ', ' + tl.street_number.short_name + ' ' + tl.route.short_name;
      }

      $scope.watchDiscoveryChange = function () { return $scope.Discovery; };  
      $scope.$watch($scope.watchDiscoveryChange, function () {
        change++;
      }, true);
    }
    
    $scope.updateDiscoverySettings = function() {
      API.updatePreferences(Boolean(parseInt($scope.Discovery.discoverable)), $scope.Discovery.age_filter.from
        , $scope.Discovery.age_filter.to, parseInt($scope.Discovery.gender_filter)
        , parseInt($scope.Discovery.distance_filter))
        .then(function(){
          console.log('Preferences updated');
      });
    };
    
    /* Passport */
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
          Cache.put('locationUpdated',true);
          API.getAccount().then(function(res){
              fillDiscovery();
            }); 
        });
      }
    }, true);
  
    $scope.$on('$locationChangeStart', function(event, next, current) {
      if(change >= 3){  
        $scope.updateDiscoverySettings();
        Cache.put('locationUpdated',true);
      }
    });
    
    $scope.resetPassport = function(){
      API.resetPassport().then(function(){
        API.getAccount().then(function(res){
            fillDiscovery();
          }); 
      });
    }
      
  });
})();
