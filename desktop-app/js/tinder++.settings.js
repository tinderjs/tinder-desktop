(function() {
  module = angular.module('tinder++.settings', []);

  module.service('Settings', function() {
    var settings = {
      set : setSetting,
      get : getSetting,
      clear : clearSetting
    };

    var data = {};

    if (localStorage.tinderToken && localStorage.settings) {
      data = JSON.parse(localStorage.settings);
    }

    return settings;

    ///////////////////////////

    function setSetting (key, value) {
      data[key] = value;
      syncSettings();
    }

    function getSetting (key) {
      return data[key];
    }

    function clearSetting (key) {
      delete data[key];
      syncSettings();
    }

    function syncSettings() {
      localStorage.settings = JSON.stringify(data);
    }
  });

  module.controller('SettingsController', function() {});

  module.directive('tppSettingSync', function(Settings) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: linkFn
    };

    function linkFn(scope, elem, attrs, modelCtrl) {
      var watchFn;
      attrs.$observe('ngModel', function(settingKey) { // Got ng-model bind path here
        (watchFn || angular.noop)();
        watchFn = scope.$watch(settingKey, function(settingValue) { // Watch given path for changes
          console.log(settingKey);  
          console.log(settingValue);  
          if (modelCtrl.$valid) 
            Settings.set(settingKey, settingValue);
        });
      });
    }
  });
})();