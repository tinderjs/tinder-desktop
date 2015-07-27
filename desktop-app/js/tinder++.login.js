(function() {
  gui = require('nw.gui');
  module = angular.module('tinder++.login', ['tinder++.api']);

  module.controller('LoginController', function LoginController($scope, $http, API) {
    $scope.loginUrl = 'https://m.facebook.com/dialog/oauth?client_id=464891386855067&redirect_uri=https://www.facebook.com/connect/login_success.html&scope=user_birthday,user_relationship_details,user_likes,user_activities,user_education_history,user_photos,user_friends,user_about_me,email,public_profile&response_type=token';
    $scope.fbAuthData = {};

    $scope.startLogin = function() {
      window.loginWindow = gui.Window.open($scope.loginUrl, {
        title: 'Login to Facebook',
        position: 'center',
        width: 400,
        height: 480,
        focus: true
      });
      var interval = window.setInterval(function() {
        if (window.loginWindow) {
          checkForToken(window.loginWindow.window, interval);
        }
      }, 500);
      window.loginWindow.on('closed', function() {
        window.clearInterval(interval);
        window.loginWindow = null;
      });
      ga_storage._trackEvent('Login', 'Login Started');
      window._rg.record('login', 'started', { origin: 'tinderplusplus' });
    };

    var tinderLogin = function() {
      API.login($scope.fbAuthData['fb_id'], $scope.fbAuthData['access_token']);
    };

    var checkForToken = function(loginWindow, interval) {
      if (loginWindow.closed) {
        window.clearInterval(interval);
      } else {
        var url = loginWindow.document.URL;
        var paramString = url.split("#")[1];
        if (!!paramString) {
          var allParam = paramString.split("&");
          for (var i = 0; i < allParam.length; i++) {
            var param = allParam[i].split("=");
            $scope.fbAuthData[param[0]] = param[1];
          }
          loginWindow.close();
          window.clearInterval(interval);
          getFBUserId($scope.fbAuthData['access_token']);
        }
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
