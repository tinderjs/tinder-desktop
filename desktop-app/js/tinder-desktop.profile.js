(function() {
  var module = angular.module('tinder-desktop.profile', ['ngRoute', 'tinder-desktop.api', 'tinder-desktop.common']);

  module.controller('ProfileController', function($scope, $routeParams, API) {
    API.userInfo($routeParams.userId).then(function(user) {
      $scope.user = user;
    });

    $scope.backLink = (localStorage.userId === $routeParams.userId) ? '#/swipe' : '#/messages';
    $scope.photoIndex = 0;
    $scope.swapPhoto = function(index) {
      $scope.photoIndex = index;
    };
  });
})();
