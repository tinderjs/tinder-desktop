(function() {
  var module = angular.module('tinder++.profile', ['ngRoute', 'tinder++.api', 'tinder++.swipe']);

  module.controller('ProfileController', function($scope, $routeParams, API) {
    API.userInfo($routeParams.userId, function(_, data) {
      $scope.user = data.results;
      ga_storage._trackEvent('Messages', 'viewed profile');
    });

    $scope.photoIndex = 0;
    $scope.swapPhoto = function(index) {
      $scope.photoIndex = index;
    };
  });
})();
