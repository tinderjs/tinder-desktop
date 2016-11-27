(function() {
  var tinder = require('tinder');
  var client = new tinder.TinderClient();
  var remote = require('remote');

  // if a token returned from tinder is in localstorage, set that token and skip auth
  if (localStorage.tinderToken) { client.setAuthToken(localStorage.tinderToken); }

  angular.module('tinder-desktop.api', []).factory('API', function($q, $location) {
    var likesRemaining = null;
    var apiObj = {};

    var handleError = function(err, callbackFn) {
      console.log('ERROR!!!!');
      console.log(err);
      //
      // // Tinder API token is not valid.
      // if (err.status === 401 && localStorage.getItem('fbTokenExpiresAt') != null) {
      //   if(Date.parse(localStorage.fbTokenExpiresAt) > new Date()) {
      //     // Facebook token is still good. Get a new Tinder token.
      //     apiObj.login(localStorage.fbUserId, localStorage.fbToken);
      //   } else {
      //     // Facebook token expired. Get a new Facebook token.
      //     $location.path('/login');
      //   }
      // } else {
      //   // Something's gone horribly wrong. Log the user out.
      //   apiObj.logout();
      // }
      (callbackFn || angular.noop)(err);
    };

    apiObj.logout = function() {
      var win = remote.getCurrentWindow();

      // Retain settings on logout.
      var removeArr = [];
      for (var i = 0; i < localStorage.length; i++){
        if (localStorage.key(i) != 'settings') {
          removeArr.push(localStorage.key(i));
        }
      }

      for (var i = 0; i < removeArr.length; i++) {
        localStorage.removeItem(removeArr[i]);
      }

      // Clear cache and cookies.
      win.webContents.session.clearCache(function(){
        win.webContents.session.clearStorageData({storages: ["cookies"]}, function(){
          win.webContents.reloadIgnoringCache();
        });
      });
    };

    apiObj.login = function(id, token) {
      client.authorize(token, id, function(err, res, data) {
        if (!!err) {
          handleError(err);
          return;
        }
        // console.log(JSON.stringify(res));
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

    apiObj.updateLocation = function(lng, lat) {
      return $q(function (resolve, reject) {
        client.updatePosition(lng, lat, function(err, res, data) {
          if (!!err) {
            handleError(err, reject);
            return;
          }
          // console.log(JSON.stringify(res));
          if (res && res.error && res.error == 'major position change not significant') {
            // clear out the stored city because we don't know where they are anymore
            localStorage.removeItem('currentCity');
            swal({
              title: 'Location not updated',
              text: 'You probably tried moving too far from your last location. Cool your jets ' +
                    'and you\'ll be able to switch again in a while (you can still use your last location).',
              type: 'error',
              confirmButtonColor: "#DD6B55",
              confirmButtonText: 'Got it'
            });
          }
          resolve(res);
        });
      });
    };

    apiObj.people = function(limit) {
      return $q(function (resolve, reject) {
        limit = limit || 10;
        client.getRecommendations(limit, function(err, res, data) {
          if (!!err) {
            handleError(err, reject);
            return;
          }
          // console.log(res.message)
          if ((res && res.message && (res.message === 'recs timeout' || res.message === 'recs exhausted')) || !res) {
            // TODO: I think alerts belong to controller
            swal({
              title: 'Out of people for now',
              text: 'This can happen if you change location too much. Try quitting, opening phone app, ' +
              'then re-opening this app to fix the problem, otherwise just wait an hour or so.',
              type: 'error',
              confirmButtonColor: "#DD6B55",
              confirmButtonText: 'Got it'
            });
          }
          resolve(res && res.results || []);
        });
      });
    };

    apiObj.userInfo = function(userId) {
      return $q(function (resolve, reject) {
        client.getUser(userId, function(err, res, data) {
          if (!!err) {
            handleError(err, reject);
            return;
          }
          if (res === null) {
            handleError('userInfo result is null', reject);
            return;
          }
          // console.log(JSON.stringify(res));
          resolve(res.results);
        });
      });
    };

    apiObj.getAccount = function() {
      return $q(function (resolve, reject) {
        client.getAccount(function(err, res, data) {
          if (!!err) {
            handleError(err, reject);
            return;
          }
          if (res === null) {
            handleError('userInfo result is null', reject);
            return;
          }
          // console.log(JSON.stringify(res));
          resolve(res);
        });
      });
    };

    apiObj.updatePreferences = function(discovery, ageMin, ageMax, gender, distance) {
      return $q(function (resolve, reject) {
        client.updatePreferences(discovery, ageMin, ageMax, gender, distance, function(err, res, data) { // change to client.getAccount
          if (!!err) {
            handleError(err, reject);
            return;
          }
          if (res === null) {
            handleError('Fail to update Preferences', reject);
            return;
          }
          resolve(res);
        });
      });
    };

    apiObj.updateBio = function(bio) {
      return $q(function (resolve, reject) {
        client.updateBio(bio, function(err, res, data) {
          if (!!err) {
            handleError(err, reject);
            return;
          }
          if (res === null) {
            handleError('Fail to update Bio', reject);
            return;
          }
          resolve(res);
        });
      });
    };

    apiObj.like = function(userId) {
      return $q(function (resolve, reject) {
        client.like(userId, function(err, res, data) {
          if (!!err) {
            handleError(err, reject);
            return;
          }
          // console.log(JSON.stringify(res));

          // if the liked user is a match, alert it right away
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

          // if you run out of likes, alert user
          } else if (res && res.rate_limited_until) {
            var rate_limited_until = moment.unix(res.rate_limited_until / 1000);
            var now = moment();
            // TODO: I think alerts belong to controller
            swal({
              title: 'Out of Swipes',
              text: 'Sorry, Tinder doesn\'t like your business. Try again at ' + rate_limited_until.format('dddd, h:mma') +
                    ' (' + now.to(rate_limited_until) + ')',
              type: 'error',
              confirmButtonColor: "#DD6B55",
              confirmButtonText: 'Out of daily likes. Maybe try Tinder Plus'
            });
          }

          // otherwise, update the amount of likes remaining and resolve the promise
          if (res && typeof res.likes_remaining != 'undefined') {
            likesRemaining = res.likes_remaining;
          }
          resolve(res);
        });
      });
    };

    apiObj.superLike = function(userId) {
      return $q(function (resolve, reject) {
        client.superLike(userId, function(err, res, data) {
          if (!!err) {
            handleError(err, reject);
            return;
          }
          // console.log(JSON.stringify(res));
          resolve(res);
        });
      });
    };

    apiObj.pass = function(userId) {
      return $q(function (resolve, reject) {
        client.pass(userId, function(err, res, data) {
          if (!!err) {
            handleError(err, reject);
            return;
          }
          console.log(JSON.stringify(res));
          resolve(res);
        });
      });
    };

    apiObj.sendMessage = function(matchId, message) {
      return $q(function (resolve, reject) {
        client.sendMessage(matchId, message, function(err, res, data) {
          if (!!err) {
            handleError(err, reject);
            return;
          }
          // console.log(JSON.stringify(res));
          resolve(res);
        });
      });
    };

    apiObj.unmatch = function(matchId, message) {
      return $q(function (resolve, reject) {
        client.unmatch(matchId, function(err, res, data) {
          if (!!err) {
            handleError(err, reject);
            return;
          }
          console.log(JSON.stringify(res));
          resolve(res);
        });
      });
    };


    apiObj.getUpdates = function() {
      return $q(function (resolve, reject) {
        client.getUpdates(function(err, res, data) {
          if (!!err) {
            handleError(err, reject);
            return;
          }
          // console.log(JSON.stringify(res));
          resolve(res);
        });
      });
    };

    apiObj.getHistory = function() {
      return $q(function (resolve, reject) {
        client.getHistory(function(err, res, data) {
          if (!!err) {
            handleError(err, reject);
            return;
          }
          // console.log(JSON.stringify(res));
          resolve(res);
        });
      });
    };

    apiObj.updatePassport =  function(lat, lon){
      return $q(function (resolve, reject) {
        client.updatePassport(lat, lon, function(err, res, data) {
          if (!!err) {
            handleError(err, reject);
            return;
          }
          // console.log(JSON.stringify(res));
          resolve(res);
        });
      });
    }

    apiObj.resetPassport =  function(){
      return $q(function (resolve, reject) {
        client.resetPassport(function(err, res, data) {
          if (!!err) {
            handleError(err, reject);
            return;
          }
          // console.log(JSON.stringify(res));
          resolve(res);
        });
      });
    }

    apiObj.getLikesRemaining = function() {
      return likesRemaining;
    };

    apiObj.getLastActivity = function() {
      return client.lastActivity;
    };

    apiObj.setLastActivity = function(activityDate) {
      client.lastActivity = activityDate;
    };

    return apiObj;
  });
})();
