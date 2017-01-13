(function() {
  var module = angular.module('tinder-desktop.profile', ['ngRoute', 'tinder-desktop.api', 'tinder-desktop.common', 'tinder-desktop.settings']);

  module.controller('ProfileController', function($scope, $route, $routeParams, API, Settings) {
    API.userInfo($routeParams.userId).then(function(user) {
      $scope.user = user;
      $scope.bioTextArea = $scope.user.bio;
    });


    $scope.showFbInfo = Settings.get('show_fb_token') === "yes";
    $scope.isMe = (localStorage['userId'] === $routeParams.userId);
    $scope.token = (localStorage['tinderToken']);
    $scope.userid = (localStorage['fbUserId']);
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
