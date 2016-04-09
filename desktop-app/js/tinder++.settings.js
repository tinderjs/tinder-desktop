(function() {
  module = angular.module('tinder++.settings', ['ngAutocomplete', 'ngSanitize', 'emoji']);

  module.service('Settings', function() {
    var settingsObj = {
      set : setSetting,
      get : getSetting,
      clear : clearSetting,
      sync : syncSettings,
      settings : {
        // set defaults here
        landingPage : '/messages',
        messageListExtraInfo : 'no'
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

    $scope.likesRemaining = null;
    $interval(function() { $scope.likesRemaining = API.getLikesRemaining(); }, 1000);
	
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
          ga_storage._trackEvent('Location', 'Location Updated');
          window._rg.record('swipe', 'location updated', { origin: 'tinderplusplus' });
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
        ga_storage._trackEvent('Location', 'Clicked Change Location');
        window._rg.record('swipe', 'clicked change location', { origin: 'tinderplusplus' });
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