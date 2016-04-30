(function() {
  module = angular.module('tinder-desktop.messages', ['tinder-desktop.api', 'tinder-desktop.settings', 'tinder-desktop.common', 'ngSanitize']);

  module.controller('MessagesController', function($scope, API, Settings) {
    // console.log(API.conversations)
    $scope.conversations = API.conversations;

    // amount of matches
    $scope.conversationCount = Object.keys($scope.conversations).length

    // show extra settings
    $scope.showExtra = Settings.get('messageListExtraInfo') === 'yes';

    // open the conversation
    $scope.open = function(matchId) {
      $scope.currentMatch = matchId;
      $scope.conversation = $scope.conversations[matchId];
    };

    // map the word enter to 13 for keypress binding
    var ENTER = 13;

    // trigger a swal alert and when confirmed, unmatch based on matchId
    $scope.unmatch = function(conversation){
      swal({
        title: "Unmatch with " + conversation.name + "?",
        text: "You will not be able to message this person",   // Unmatch with conversation.name
        type: "info",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Yes, unmatch",
        closeOnConfirm: true },
      function(){
        API.unmatch(conversation.matchId)
      });
    };

    // determine the color to show based on last message
    $scope.lastMessageClass = function (match) {
      if (match.messages.length) {
        // select last message
        var lastMessage = match.messages[match.messages.length - 1];

        // if last message is from me
        if (lastMessage.fromMe) {
          // TODO: figure out the rest of these messages and their mapping to CSS
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

    // TODO: Link into here for sending messages based on a click, copy the pending pattern
    // capture enter keypresses and send the written message
    $scope.keypress = function(event) {
      if (event.which == ENTER) {
        event.preventDefault();
        if ($scope.message.length > 0) {
          API.sendMessage($scope.conversation.matchId, $scope.message);
          // Show pending message
          $scope.conversation.pending = $scope.conversation.pending || [];
          // send the current message to pending conversations
          $scope.conversation.pending.push($scope.message);
          // Reset to an empty message
          $scope.message = '';
        }
      }
    };

  //   $scope.selectMessage = function (event) {
  //     // TODO: Fix: We don't want $scope.message here
  //     API.sendMessage($scope.conversation.matchId, $scope.message);
  //     // Show pending message
  //     $scope.conversation.pending = $scope.conversation.pending || [];
  //     // send the current message to pending conversations
  //     $scope.conversation.pending.push($scope.message);
  //     // Reset to an empty message
  //     $scope.message = '';
  //   }
  // });

  // Order objects by a certain field
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

  // TODO: Document this directive
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

    // time formatter
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
        // console.log("Scrolling", scope);
        setTimeout(function(){
          angular.element(element)[0].scrollIntoView();
        });
      }
    };
  });
})();
