(function() {
  const BrowserWindow = require('electron').remote.BrowserWindow;

  module = angular.module('tinder-desktop.login', ['tinder-desktop.api']);

  module.controller('LoginController', function LoginController($scope, $http, API) {
    $scope.loginUrl = 'https://www.facebook.com/v2.6/dialog/oauth?redirect_uri=fb464891386855067%3A%2F%2Fauthorize%2F&state=%7B%22challenge%22%3A%22q1WMwhvSfbWHvd8xz5PT6lk6eoA%253D%22%2C%22com.facebook.sdk_client_state%22%3Atrue%2C%223_method%22%3A%22sfvc_auth%22%7D&scope=user_birthday%2Cuser_photos%2Cuser_education_history%2Cemail%2Cuser_relationship_details%2Cuser_friends%2Cuser_work_history%2Cuser_likes&response_type=token%2Csigned_request&default_audience=friends&return_scopes=true&auth_type=rerequest&client_id=464891386855067&ret=login&sdk=ios';
    $scope.fbAuthData = {};

    $scope.startLogin = function() {
      var userAgent = "Mozilla/5.0 (Linux; U; en-gb; KFTHWI Build/JDQ39) AppleWebKit/535.19 (KHTML, like Gecko) Silk/3.16 Safari/535.19"
      var window = new BrowserWindow({ 
        width: 700, 
        height: 600, 
        show: false, 
        webPreferences: {
          nodeIntegration: false 
        }
      });
      window.setMenu(null);
      window.loadURL($scope.loginUrl, { 'userAgent': userAgent });
      window.show();

      var interval = setInterval(function() {
        if (window) checkForToken(window, interval);  
      }, 500);

      window.on('closed', function() {
        window = null;
      });
    };

    var tinderLogin = function() {
      API.login(localStorage.fbUserId, localStorage.fbToken);
    };

    var checkForToken = function(loginWindow, interval) {
      var url = loginWindow.getURL();
      if (url === 'https://m.facebook.com/v2.6/dialog/oauth/confirm') {
        loginWindow.webContents.executeJavaScript("unescape(document.getElementsByTagName('script')[0].innerHTML)", false,
                                                  function(result) {
                                                    loginWindow.close();
                                                    getFBToken(result);
                                                  });
      }
    };

    var getFBToken = function(result) {
      var tokenPattern = /access_token=(.*)&/;
      var expirationPattern = /expires_in=(.*)/;
      var token = result.match(tokenPattern)[1];
      var expiration = parseInt(result.match(expirationPattern)[1]);
      $scope.fbAuthData['access_token'] = token;
      localStorage.fbToken = $scope.fbAuthData['access_token'];
      var now = Date.now();
      var expiryTime = new Date(now + (1000 * expiration));
      localStorage.fbTokenExpiresAt = expiryTime;
      getFBUserId($scope.fbAuthData['access_token']);
    };

    var getFBUserId = function(token) {
      var graphUrl = 'https://graph.facebook.com/me?access_token=' + token;
      $http.get(graphUrl)
          .success(function(data) {
            $scope.fbAuthData['fb_id'] = data.id;
            localStorage.fbUserId = $scope.fbAuthData['fb_id'];
            tinderLogin();
          })
          .error(function(data) {
            console.log(data);
          });
    }

    var init = function () {
      // Pop the login window if the user was involuntarily logged out.
      if(localStorage.length > 1) $scope.startLogin();
    };
    init();
  });
})();
