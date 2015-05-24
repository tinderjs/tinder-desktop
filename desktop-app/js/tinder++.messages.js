(function() {
  module = angular.module('tinder++.messages', ['tinder++.api']);

  module.controller('MessagesController', function($scope, API) {
    $scope.conversations = API.conversations;
    $scope.open = function(matchId) {
      $scope.conversation = $scope.conversations[matchId];
    };
    var ENTER = 13;
    $scope.keypress = function(event) {
      if (event.which == ENTER) {
        event.preventDefault();
        if ($scope.message.length > 0) {
          API.sendMessage($scope.conversation.matchId, $scope.message);
          $scope.message = '';
        }
      }
    };
  });

  module.filter('orderObjectBy', function() {
    return function(items, field, reverse) {
      var filtered = [];
      angular.forEach(items, function(item) {
        filtered.push(item);
      });
      filtered.sort(function (a, b) {
        return (a[field] > b[field] ? 1 : -1);
      });
      if (reverse) { filtered.reverse(); }
      return filtered;
    };
  });

})();
