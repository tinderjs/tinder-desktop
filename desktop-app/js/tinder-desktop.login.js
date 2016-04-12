(function() {
  const BrowserWindow = require('electron').remote.BrowserWindow;

  module = angular.module('tinder-desktop.login', ['tinder-desktop.api']);

  module.controller('LoginController', function LoginController($scope, $http, API) {
    $scope.loginUrl = 'https://m.facebook.com/dialog/oauth?client_id=464891386855067&redirect_uri=https://www.facebook.com/connect/login_success.html&scope=user_birthday,user_relationship_details,user_likes,user_activities,user_education_history,user_photos,user_friends,user_about_me,email,public_profile&response_type=token';
    $scope.fbAuthData = {};

    $scope.startLogin = function() {
      var window = new BrowserWindow({ 
        width: 700, 
        height: 600, 
        show: false, 
        webPreferences: {
          nodeIntegration: false 
        }
      });
      window.loadURL($scope.loginUrl);
      window.show();

      var interval = setInterval(function() {
        if (window) checkForToken(window, interval);  
      }, 500);

      window.on('closed', function() {
        window = null;
      });
    };

    var tinderLogin = function() {
      API.login($scope.fbAuthData['fb_id'], $scope.fbAuthData['access_token']);
    };

    var checkForToken = function(loginWindow, interval) {
      var url = loginWindow.getURL();
      var paramString = url.split("#")[1];
      if (!!paramString) {
        var allParam = paramString.split("&");
        for (var i = 0; i < allParam.length; i++) {
          var param = allParam[i].split("=");
          $scope.fbAuthData[param[0]] = param[1];
        }
        loginWindow.close();
        getFBUserId($scope.fbAuthData['access_token']);
      }
    };

    var getFBUserId = function(token) {
      var graphUrl = 'https://graph.facebook.com/me?access_token=' + token;
      $http.get(graphUrl)
          .success(function(data) {
            console.log(data);
            $scope.fbAuthData['fb_id'] = data.id;
            tinderLogin();
          })
          .error(function(data) {
            console.log(data);
          });
    }
  });
})();
