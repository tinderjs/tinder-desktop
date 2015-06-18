(function() {
  module = angular.module('tinder++.settings', []);

  module.service('Settings', function() {
    var settingsObj = {
      set : setSetting,
      get : getSetting,
      clear : clearSetting,
      sync : syncSettings,
      settings : {
        // set defaults here
        landingPage : '/swipe'
      }
    };

    if (localStorage.settings) {
      angular.extend(settingsObj.settings, JSON.parse(localStorage.settings));
    }

    return settingsObj;

    ///////////////////////////

    function setSetting (key, value) {
      if (settingsObj.settings[key] !== value) {
        settingsObj.settings[key] = value;
        syncSettings();
      }
    }

    function getSetting (key) {
      return settingsObj.settings[key];
    }

    function clearSetting (key) {
      delete settingsObj.settings[key];
      syncSettings();
    }

    function syncSettings() {
      var settingString = localStorage.settings = JSON.stringify(settingsObj.settings);
      console.log(settingString);
    }
  });

  module.controller('SettingsController', function($scope, Settings, API) {
    $scope.settings = Settings.settings;
    $scope.syncSettings = Settings.sync;

    $scope.logout = function() {
      API.logout();
    };
  });
})();