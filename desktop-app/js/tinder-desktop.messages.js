(function() {
  module = angular.module('tinder-desktop.messages', ['tinder-desktop.api', 'tinder-desktop.settings', 'tinder-desktop.common', 'ngSanitize']);

  module.controller('MessagesController', function($scope, API, Settings, Cleverbot) {

    // here's auto generate an opener for when you need it
    // Cleverbot.getResponse('What\'s up?').then(function(response){
    //   $scope.cleverbotResponse = response;
    // });



    // $scope.sendResponse = function(){
    //   API.sendMessage($scope.conversation.matchId, $scope.cleverbotResponse);
    //   // Show pending message
    //   $scope.conversation.pending = $scope.conversation.pending || [];
    //   $scope.conversation.pending.push($scope.cleverbotResponse);
    //   // Reset
    //   $scope.cleverbotResponse = '';
    // }

    // console.log(API.conversations)
    $scope.conversations = API.conversations;
    $scope.conversationCount = Object.keys($scope.conversations).length
    $scope.showExtra = Settings.get('messageListExtraInfo') === 'yes';

    $scope.open = function(matchId) {
      $scope.currentMatch = matchId
      $scope.conversation = $scope.conversations[matchId];
    };
    var ENTER = 13;

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
    }

    $scope.generateResponseForLastMessage = function(){
      var lastMessageNumber = ($scope.conversation.messages.length - 1);
      var lastMessage = $scope.conversation.messages[lastMessageNumber].text;

      Cleverbot.getResponse(lastMessage).then(function(response){
        $scope.cleverbotResponse = response;
      });
    };

    $scope.sendResponse = function ($event) {
      API.sendMessage($scope.conversation.matchId, $event.target.innerHTML);
      // Show pending message
      $scope.conversation.pending = $scope.conversation.pending || [];
      $scope.conversation.pending.push($event.target.innerHTML);
    }

    $scope.generateResponsesForLastMessage = function(){

      var lastMessage;

      console.log($scope.conversation.messages.length); // 0

      // if there is a conversation, use the last thing
      if( $scope.conversation.messages.length > 0 ){
        var lastMessageNumber = ($scope.conversation.messages.length - 1);
         lastMessage = $scope.conversation.messages[lastMessageNumber].text;
      }
      //
      else {
         lastMessage = '';
      }

      $scope.cleverbotResponses = [];

      var amountOfResponses = 4;

      // loop through and get the four responses;
      for(var i = 0; i < amountOfResponses; i++){
        Cleverbot.getResponse(lastMessage).then(function(response){
          $scope.cleverbotResponses.push(response)
        });
      }
    };

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
        // console.log("Scrolling", scope);
        setTimeout(function(){
          angular.element(element)[0].scrollIntoView();
        });
      }
    };
  });
})();
