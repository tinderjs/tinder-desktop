(function() {
  module = angular.module('tinder++.controls', ['tinder++.api']);

  module.service('Controls', function(API, $interval, $q, orderByFilter, $timeout) {

    var controls = {
      'init': init
    };

    var infoQueue, pendingInfoRequests;

    // Init / Decorate API 

    API.conversations = {};

    // Decorate userInfo to update conversation after request
    API.userInfo = (function (API_userInfo) {
      return function (userId) {

        if (!userId) {
          return angular.noop;
        }

        var userIdToMatchId = {};
        Object.keys(API.conversations).forEach(function(matchId) {
          var conversation = API.conversations[matchId];
          userIdToMatchId[conversation.userId] = matchId;
        });

        var promise = API_userInfo(userId);
        promise.then(function(uId) {
          updateMatchInfo(userIdToMatchId[userId])(uId);
        }, function(err) {
          console.log('woah, user must be gone #botnet');
          console.log(err);
          if (err && err.status && err.status === 'not found') {
            console.log('deleting convo');
            delete API.conversations[userId];
          }
        });
        return promise;
      };
    })(API.userInfo);

    // End - Init / Decorate API 

    return controls;

    ///////////////////////////////

    function init () {

      resetInfoQueue();

      // If loggedin sync from localStorage and start periodic updates
      if (localStorage.tinderToken) {
        if (localStorage.conversations) {
          API.conversations = JSON.parse(localStorage.conversations);
          API.setLastActivity(new Date(localStorage.lastActivity));
        } else {
          API.getHistory().then(update);
        }

        $interval(function() { API.getUpdates().then(update); }, 10000);
        API.getUpdates().then(update); // call right away for good measure
      }
    }

    function update (data) {
      if (data) {
        data.matches.forEach(function(match) {
          if( (! API.conversations[match._id]) && (!(match.pending || match.dead)) ) {
            createConversation(match);
            if (match.person) {
              var user = match.person;
              swal({
                title: 'It\'s a match!',
                text: 'Go send a message to ' + user.name,
                confirmButtonText: 'Nice!',
                imageUrl: user.photos[0].processedFiles[3].url
              });
              ga_storage._trackEvent('Events', 'Match');
              window._rg.record('controls', 'match', { origin: 'tinderplusplus' });
            } 
          }

          match.messages.forEach(addMessage);
        });

        data.blocks.forEach(function(blockedMatchId) {
          delete API.conversations[blockedMatchId];
        });

        localStorage.conversations = JSON.stringify(API.conversations);
        localStorage.lastActivity = API.getLastActivity().toISOString();
      } else {
        console.log('error: data is null');
      }

      // update match conversations with match profile info
      orderByFilter(Object.keys(API.conversations).map(function (matchId) {
        return API.conversations[matchId];
      }), 'lastActive', true).forEach(function(conversation) {
        var matchId = conversation.matchId;
        var updateTime = !conversation.infoUpdateTime || moment().isAfter(conversation.infoUpdateTime);

        if (updateTime && !pendingInfoRequests[matchId]) {
          addMatchToInfoQueue(matchId);
        }
      });
    }

    function createConversation (match) {
      API.conversations[match._id] = {
        matchId: match._id,
        userId: (match.person ? match.person._id : null),
        name: (match.person ? match.person.name : null),
        thumbnail: (match.person ? match.person.photos[0].processedFiles[3].url : null),
        messages: [],
        pending: [],
        lastActive: match.created_date
      };
    }

    function addMessage (message) {
      API.conversations[message.match_id].lastActive = message.sent_date;
      API.conversations[message.match_id].messages.push({
        sentDate: message.sent_date,
        text: message.message,
        fromMe: (message.from == localStorage.userId)
      })
      // Remove possibly pending messages
      var pending = API.conversations[message.match_id].pending;
      if(Array.isArray(pending) && pending.indexOf(message.message) >= 0) {
        pending.splice(pending.indexOf(message.message), 1);
      }
    }

    function addMatchToInfoQueue(matchId) {
      var conversation = API.conversations[matchId];
      var matchUserId = conversation.userId;
      pendingInfoRequests[matchId] = true;

      if (matchUserId) {
        infoQueue = infoQueue.then(pauseQueue(100)).then(getMatchInfo(matchUserId)).finally(cleanUpInfoRequest(matchId));
      } else {
        console.log('deleting conversation');
        delete API.conversations[matchId];
        cleanUpInfoRequest(matchId);
      }
      
      // piggybacking off conversation localstorage sync
    }

    function pauseQueue(timeMs) {
      return function () {
        return $timeout(angular.noop, timeMs);
      };
    }

    function getMatchInfo(matchUserId) {
      return function () {
        return API.userInfo(matchUserId);
      };
    }

    function updateMatchInfo(matchId) {
      return function (user) {
        var conversation = API.conversations[matchId];
        if (conversation) {
          angular.extend(conversation, {
            userDistanceMi: user.distance_mi,
            userPingTime: user.ping_time,
            infoUpdateTime: calcUserUpdateTimeISOString(user)
          });
        }
      };
    }

    function cleanUpInfoRequest(matchId) {
      return function () {
        delete pendingInfoRequests[matchId];
        var left = Object.keys(pendingInfoRequests).length;
        if (!left) resetInfoQueue();
      };
    }

    function resetInfoQueue () {
      pendingInfoRequests = {};
      infoQueue = $q.when();
    }

    function calcUserUpdateTimeISOString(user) {
      var updateMinutes = user.distance_mi;
      if (updateMinutes < 5) 
        updateMinutes = Math.ceil((Math.random() * 5));
      if (updateMinutes > 30) 
        updateMinutes = Math.floor((Math.random() * 30) + 30);
      return moment().add(updateMinutes, 'minutes').toISOString();
    }
  });
})();
