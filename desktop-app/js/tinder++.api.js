(function() {
  var tinder = require('tinderjs');
  var client = new tinder.TinderClient();
  if (localStorage.tinderToken) { client.setAuthToken(localStorage.tinderToken); }

  angular.module('tinder++.api', []).factory('API', function($interval) {
    var apiObj = {};

    apiObj.login = function(id, token) {
      ga_storage._trackEvent('Login', 'Facebook Login Successful');
      client.authorize(token, id, function(err, res, data) {
        console.log(res);
        localStorage.tinderToken = client.getAuthToken();
        localStorage.name = res.user.full_name;
        localStorage.smallPhoto = res.user.photos[0].processedFiles[3].url;
        localStorage.userId = res.user._id;
        if (window.loginWindow) {
          window.loginWindow.close(true);
        }
        window.location.reload();
      });
    };
    apiObj.updateLocation = function(lng, lat, callback) {
      client.updatePosition(lng, lat, function(err, res, data) {
        console.log(res);
        callback();
      });
    };
    apiObj.people = function(callbackFn, limit) {
      limit = limit || 10;
      client.getRecommendations(limit, function(err, res, data) {
        if ((res && res.message && (res.message === 'recs timeout' || res.message === 'recs exhausted')) || !res) {
          //FIXIT: I think alerts belong to controller
          swal({
            title: 'Out of people for now',
            text: 'This can happen if you change location too much. Try quitting, opening phone app, ' +
            'then re-opening this app to fix the problem, otherwise just wait an hour or so.',
            type: 'error',
            confirmButtonColor: "#DD6B55",
            confirmButtonText: 'Got it'
          });
        } else {
          if (res && res.results) {
            callbackFn(res.results);
          } else {
            callbackFn([]);
          }
        }
      });
    };
    apiObj.userInfo = function(userId, callbackFn) {
      client.getUser(userId, function(err, res, data) {
        console.log(res);
        callbackFn(err, res, data);
      });
    };
    apiObj.like = function(userId) {
      client.like(userId, function(err, res, data) {
        console.log(res);
        if (res && res.match) {
          apiObj.userInfo(res.match.participants[1], function(err2, res2, data2) {
            var user = res2.results;
            swal({
              title: 'It\'s a match!',
              text: 'Go send a message to ' + user.name,
              confirmButtonText: 'Nice!',
              imageUrl: user.photos[0].processedFiles[3].url
            });
          });
        }
      });
    };
    apiObj.pass = function(userId) {
      client.pass(userId, function(err, res, data) {
        console.log(res);
      });
    };

    var createConversation = function(match) {
      apiObj.conversations[match._id] = {
        matchId: match._id,
        userId: match.person._id,
        name: match.person.name,
        thumbnail: match.person.photos[0].processedFiles[3].url,
        messages: [],
        lastActive: match.created_date
      };
    };

    var addMessage = function(message) {
      apiObj.conversations[message.match_id].lastActive = message.sent_date;
      apiObj.conversations[message.match_id].messages.push({
        text: message.message,
        fromMe: (message.from == localStorage.userId)
      })
    };

    var update = function(_, data) {
      data.matches.forEach(function(match) {
        if( (! apiObj.conversations[match._id]) && (!(match.pending || match.dead)) )
          createConversation(match);

        match.messages.forEach(addMessage);
      });

      data.blocks.forEach(function(blockedMatchId) {
        delete apiObj.conversations[blockedMatchId];
      });

      localStorage.conversations = JSON.stringify(apiObj.conversations);
      localStorage.lastActivity = client.lastActivity.toISOString();
    };

    if(localStorage.tinderToken) {
      if(localStorage.conversations) {
        apiObj.conversations = JSON.parse(localStorage.conversations);
        client.lastActivity = new Date(localStorage.lastActivity);
      } else {
        apiObj.conversations = {}
        client.getHistory(update);
      }

      $interval(function() { client.getUpdates(update); }, 4000);
    }

    apiObj.sendMessage = client.sendMessage;

    return apiObj;
  });
})();
