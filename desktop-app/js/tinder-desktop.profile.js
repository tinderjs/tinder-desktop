(function() {
  var module = angular.module('tinder-desktop.profile', ['ngRoute', 'tinder-desktop.api', 'tinder-desktop.common']);

  module.controller('ProfileController', function($scope, $route, $routeParams, API) {
    API.userInfo($routeParams.userId).then(function(user) {
      $scope.user = user;
      $scope.bioTextArea = $scope.user.bio;
    });


    $scope.isMe = (localStorage['userId'] === $routeParams.userId);
    $scope.backLink = (localStorage.userId === $routeParams.userId) ? '#/swipe' : '#/messages';
    $scope.photoIndex = 0;
    $scope.swapPhoto = function(index) {
      $scope.photoIndex = index;
    };
    $scope.saveBio = function() {
      API.updateBio($scope.bioTextArea).then(function(){
        $route.reload();
      });
    };
  });
})();
