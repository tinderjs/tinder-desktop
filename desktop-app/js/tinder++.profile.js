(function() {
  var module = angular.module('tinder++.profile', ['ngRoute', 'tinder++.api', 'tinder++.swipe']);

  module.controller('ProfileController', function($scope, $routeParams, API) {
    API.userInfo($routeParams.userId).then(function(user) {
      $scope.user = user;
      ga_storage._trackEvent('Messages', 'viewed profile');
    });

    $scope.backLink = (localStorage.userId === $routeParams.userId) ? '#/swipe' : '#/messages';
    $scope.photoIndex = 0;
    $scope.swapPhoto = function(index) {
      $scope.photoIndex = index;
    };
  });
})();
