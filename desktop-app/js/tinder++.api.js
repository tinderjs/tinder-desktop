(function() {
  var gui = require('nw.gui');
  var tinder = require('tinder');
  var client = new tinder.TinderClient();

  // if a token returned from tinder is in localstorage, set that token and skip auth
  if (localStorage.tinderToken) { client.setAuthToken(localStorage.tinderToken); }

  angular.module('tinder++.api', []).factory('API', function($q) {
    var likesRemaining = null;
    var apiObj = {};

    var handleError = function(err, callbackFn) {
      console.log('ERROR!!!!');
      console.log(err);

      // api token invalid, logout and refresh
      if (err.status === 401) {
        apiObj.logout();
      }
      (callbackFn || angular.noop)(err);
      ga_storage._trackEvent('API Error', JSON.stringify(err));
      window._rg.record('error', 'api error', { origin: 'tinderplusplus', error : JSON.stringify(err) });
    };

    apiObj.logout = function() {
      localStorage.clear();
      // clear the cache
      gui.App.clearCache();
      var nwWin = gui.Window.get();

      function removeCookie(cookie) {
        var lurl = "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain + cookie.path;
        nwWin.cookies.remove({ url: lurl, name: cookie.name },
        function(result) {
          if (result) {
            if (!result.name) { result = result[0]; }
            console.log('cookie remove callback: ' + result.name + ' ' + result.url);
          } else {
            console.log('cookie removal failed');
          }
        });
      }

      nwWin.cookies.getAll({}, function(cookies) {
        console.log('Attempting to remove '+cookies.length+' cookies...');
        for (var i=0; i<cookies.length; i++) {
          removeCookie(cookies[i]);
        }
      });
      gui.Window.get().reloadIgnoringCache();
    };

    apiObj.login = function(id, token) {
      ga_storage._trackEvent('Login', 'Facebook Login Successful');
      window._rg.record('api', 'facebook login successful', { origin: 'tinderplusplus' });
      client.authorize(token, id, function(err, res, data) {
        if (!!err) { 
          handleError(err);
          return;
        }
        console.log(JSON.stringify(res));
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
          console.log(JSON.stringify(res));
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
            ga_storage._trackEvent('Events', 'Out of people');
            window._rg.record('api', 'tinderplusplus.api.out_of_people', { origin: 'tinderplusplus' });
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
              ga_storage._trackEvent('Events', 'Match');
              window._rg.record('api', 'match', { origin: 'tinderplusplus' });
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
            ga_storage._trackEvent('Events', 'Rate Limited');
            window._rg.record('api', 'rate limited', { origin: 'tinderplusplus' });
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
          console.log(JSON.stringify(res, data));
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
          console.log(JSON.stringify(res));
          resolve(res);
        });        
      });
    };

    apiObj.unmatch = function(matchId, message) {
      return $q(function (resolve, reject) {
        client.unmatch(matchId, message, function(err, res, data) {
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
          console.log(JSON.stringify(res));
          resolve(res);
        });        
      });
    };

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
