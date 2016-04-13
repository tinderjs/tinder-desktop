(function() {
  module = angular.module('tinder-desktop.settings', ['ngAutocomplete', 'ngSanitize']);

  module.service('Settings', function() {
    var settingsObj = {
      set : setSetting,
      get : getSetting,
      clear : clearSetting,
      sync : syncSettings,
      settings : {
        // set defaults here
        landingPage : '/swipe',
        messageListExtraInfo : 'no',
        distanceUnits: 'mi'
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

  module.controller('SettingsController', function($scope, $timeout, $interval, Settings, API) {
    $scope.settings = Settings.settings;
    $scope.syncSettings = Settings.sync;
	$scope.showLocation = false;

    $scope.logout = function() {
      API.logout();
    };

    $scope.autocompleteOptions = {
      types: '(cities)'
    };

    $scope.getCookie = function(cookieName) {
      return localStorage[cookieName];
    };

	    $scope.watchAutocomplete = function () { return $scope.details; };
    $scope.$watch($scope.watchAutocomplete, function (details) {
      if (details) {
        localStorage.currentCity = details.name;
        var fuzzAmount = +(Math.random() * (0.0000009 - 0.0000001) + 0.0000001);
        var lng = (parseFloat(details.geometry.location.lng()) + fuzzAmount).toFixed(7);
        var lat = (parseFloat(details.geometry.location.lat()) + fuzzAmount).toFixed(7);
        API.updateLocation(lng.toString(), lat.toString()).then(function() {
          getPeople();
        });
        $scope.showLocation = false;
      }
    }, true);

    $scope.toggleLocation = function() {
      $('#autocompleteLocation').val('');
      if ($scope.showLocation) {
        $scope.showLocation = false;
      } else {
        swal({
          title: 'Warning',
          text: 'If you change location too much, you might lose access to swiping for a few hours.',
          type: 'warning',
          showCancelButton: true,
          confirmButtonColor: "#F8C086",
          confirmButtonText: 'Got it',
          closeOnConfirm: true
        }, function() {
          $scope.showLocation = true;
          $timeout(function() {
            $scope.$apply();
            $('#autocompleteLocation').focus();
          }, 0, false);
        });
      }
    };

  });
})();
