(function() {
  module = angular.module('tinder++.messages', ['tinder++.api', 'tinder++.settings', 'ngSanitize', 'emoji']);

  module.controller('MessagesController', function($scope, API, Settings) {
    $scope.conversations = API.conversations;
    $scope.showExtra = Settings.get('messageListExtraInfo') === 'yes';
    $scope.open = function(matchId) {
      $scope.conversation = $scope.conversations[matchId];
      ga_storage._trackEvent('Messages', 'opened thread');
      window._rg.record('messages', 'opened thread', { origin: 'tinderplusplus' });
    };
    var ENTER = 13;

    $scope.lastMessageClass = function (match) {
      if (match.messages.length) {
        var lastMessage = match.messages[match.messages.length - 1];
        if (lastMessage.fromMe) {
          if (moment(match.userPingTime).isAfter(lastMessage.sentDate)) {
            return 'last-me-pass';
          } else {
            return 'last-me-rest';
          }
        } else {
          return 'last-them';
        }
      }
      return '';
    };

    $scope.keypress = function(event) {
      if (event.which == ENTER) {
        event.preventDefault();
        if ($scope.message.length > 0) {
          API.sendMessage($scope.conversation.matchId, $scope.message);
          ga_storage._trackEvent('Messages', 'sent message');
          window._rg.record('messages', 'sent message', { origin: 'tinderplusplus' });
          // Show pending message
          $scope.conversation.pending = $scope.conversation.pending || [];
          $scope.conversation.pending.push($scope.message);
          // Reset
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
  
  module.directive('shortTimeAgo', function($interval) {
    return {
      restrict: 'A',
      scope: {
        shortTimeAgo: '@'
      },
      link: linkFn
    };

    function linkFn (scope, element, attrs) {
      var stopTime, observeFn;

      function refreshTime() {
        var minutes = moment().diff(scope.shortTimeAgo, 'minutes');
        minutes = isNaN(minutes) ? 0 : minutes;
        element.text(minutesToShortTime(minutes));
      }

      stopTime = $interval(refreshTime, 30000);
      observeFn = attrs.$observe('shortTimeAgo', refreshTime);

      element.on('$destroy', function() {
        $interval.cancel(stopTime);
        observeFn();
      });
    }

    function minutesToShortTime (minutes) {
      var hours = Math.floor(minutes / 60);
      var days = Math.floor(minutes / 1440);
      if (minutes < 60)
        return minutes + 'm';
      else if (hours < 24)
        return hours + 'h';
      return days + 'd';
    }
  });

  // Scroll to bottom in conversations
  module.directive('scrollToLast', function() {
    return function(scope, element, attrs) {
      if(scope.$last) {
        console.log("Scrolling", scope);
        setTimeout(function(){
          angular.element(element)[0].scrollIntoView();
        });
      }
    };
  });
})();
