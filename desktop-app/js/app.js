(function() {
  // resize to window to full screen height
  var resizeToHeight = Math.min(820, window.screen.availHeight);
  window.resizeTo(window.innerWidth, resizeToHeight);

  var gui = require('nw.gui');
  var win = gui.Window.get();

  if (process.platform === 'darwin') {
    var nativeMenuBar = new gui.Menu({ type: 'menubar' });
    nativeMenuBar.createMacBuiltin('Tinder⁺⁺', {
      hideEdit: true
    });
    win.menu = nativeMenuBar;
  }

  var app = angular.module('tinder++', ['ngAutocomplete', 'ngRoute']);
  var tinder = require('tinderjs');
  var client = new tinder.TinderClient();
  if (localStorage.tinderToken) { client.setAuthToken(localStorage.tinderToken); }

  app.config(function($routeProvider) {
    ['login', 'swipe'].forEach(function(route) {
        $routeProvider.when('/' + route, {
            templateUrl: route + '.html',
            controller: capitalize(route) + 'Controller'
        });
    });
  });

  app.run(function($location) {
      var firstPage = (localStorage.tinderToken ? '/swipe' : '/login');
      $location.path(firstPage);
  });

  app.factory('API', function API() {
    var apiObj = {};

    apiObj.login = function(id, token) {
      ga_storage._trackEvent('Login', 'Facebook Login Successful');
      client.authorize(token, id, function(err, res, data) {
        console.log(res);
        localStorage.tinderToken = client.getAuthToken();
        localStorage.name = res.user.full_name;
        localStorage.smallPhoto = res.user.photos[0].processedFiles[3].url;
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
              text: 'Go send a message to ' + user.name + ' (on your phone for now)',
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
    apiObj.message = function(userId, message) {
      client.sendMessage(userId, message, function(err, res, data) {
        console.log(res);
      });
    };

    return apiObj;
  });

  app.controller('SwipeController', function SwipeController($scope, $http, $timeout, $window, API) {
    $scope.allPeople = [];
    $scope.peopleIndex = 0;
    $scope.showLocation = false;
    $scope.apiQueue = [];
    var queueTimer = null;

    $scope.autocompleteOptions = {
      types: '(cities)'
    };

    $scope.logout = function() {
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

    $scope.swapPhoto = function(index) {
      $scope.allPeople[$scope.peopleIndex].photoIndex = index;
    };

    $scope.getCookie = function(cookieName) {
      return localStorage[cookieName];
    };

    $scope.watchAutocomplete = function () { return $scope.details; };
    $scope.$watch($scope.watchAutocomplete, function (details) {
      if (details) {
        localStorage.currentCity = details.name;
        var fuzzAmount = +(Math.random() * (0.00000009 - 0.00000001) + 0.00000001).toFixed(8);
        var lng = parseFloat(details.geometry.location.B) + fuzzAmount;
        var lat = parseFloat(details.geometry.location.k) + fuzzAmount;
        API.updateLocation(lng.toString(), lat.toString(), function() {
          ga_storage._trackEvent('Location', 'Location Updated');
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
          $scope.$apply();
          $timeout(function() {
            $('#autocompleteLocation').focus();
          }, 0, false);
        });
      }
    };

    $scope.$on('cardsRendered', function() {
      initCards();
    });

    var getPeople = function() {
      flushApiQueue();
      API.people(setPeople);
      ga_storage._trackEvent('People', 'Loading more people');
    };

    var setPeople = function(people) {
      if (people && people.length) {
        $scope.peopleIndex = 0;
        $scope.allPeople = people;
        $.map($scope.allPeople, function(person) { person.photoIndex = 0; });
        $scope.$apply();
      }
    };

    var addToApiQueue = function(data) {
      if (queueTimer) {
        $timeout.cancel(queueTimer);
      }
      if ($scope.apiQueue.length > 0) {
        var oldData = $scope.apiQueue.shift();
        if (oldData && oldData.user) {
          API[oldData.method](oldData.user._id);
        }
      }
      $scope.apiQueue.push(data);
      $scope.$apply();
      queueTimer = $timeout(function() {
        flushApiQueue();
      }, 10000, false);
    };

    var flushApiQueue = function() {
      while ($scope.apiQueue.length > 0) {
        var oldData = $scope.apiQueue.shift();
        if (oldData && oldData.user) {
          API[oldData.method](oldData.user._id);
        }
      }
      $scope.$apply();
    };

    $scope.undo = function() {
      $scope.apiQueue.pop();
      $scope.peopleIndex--;
      var cardEl = $scope.cards[$scope.cards.length - $scope.peopleIndex - 1];
      $(cardEl).fadeIn(250, function() {
        var card = window.stack.getCard(cardEl);
        card.throwIn(0, 0);
      });
      ga_storage._trackEvent('Undo', 'Clicked Undo');
    };

    var firstLoad = true;

    var initCards = function() {
      $scope.cards = [].slice.call($('.tinder-card'));
      var $faderEls;

      var config = {
        throwOutConfidence: function (offset, element) {
          return Math.min(Math.abs(offset) / (element.offsetWidth / 3), 1);
        }
      };
      window.stack = gajus.Swing.Stack(config);

      $scope.cards.forEach(function (targetElement) {
        window.stack.createCard(targetElement);
      });

      window.stack.on('throwout', function (e) {
        var user = $scope.allPeople[$scope.peopleIndex];
        addToApiQueue({
          method: (e.throwDirection < 0) ? 'pass' : 'like',
          user: user
        });
        $scope.peopleIndex++;
        $scope.$apply();
        $(e.target).fadeOut(500);
        if ($scope.peopleIndex >= $scope.allPeople.length) {
          getPeople();
        }
        ga_storage._trackEvent('Swipe', (e.throwDirection < 0) ? 'pass' : 'like');
      });

      window.stack.on('throwin', function (e) {
        $('.pass-overlay, .like-overlay').css('opacity', 0);
      });

      var fadeDebounce = debounce(function(opacity) {
        if ($faderEls)
          $faderEls.css('opacity', opacity);
      }, 10);

      window.stack.on('dragmove', function (obj) {
        obj.origEvent.srcEvent.preventDefault();
        if (!$passOverlay || !$likeOverlay) {
          $passOverlay = $(obj.target).children('.pass-overlay');
          $likeOverlay = $(obj.target).children('.like-overlay');
        }
        if (!$faderEls) {
          $faderEls = $('.fader');
        }

        var opacity = (1 - obj.throwOutConfidence).toFixed(2);
        if ($faderEls && (parseFloat($faderEls.first().css('opacity')).toFixed(2) != opacity)) {
          fadeDebounce(opacity);
        }

        if (obj.throwDirection < 0) { // left
          pass(obj.throwOutConfidence);
        } else { // right
          like(obj.throwOutConfidence);
        }
      });

      window.stack.on('dragend', function(e) {
        $passOverlay = $likeOverlay = null;
        if ($faderEls) {
          $faderEls.fadeTo(600, 1);
          $faderEls = null;
        }
      });

      if (firstLoad) {
        console.log('running firstload');
        firstLoad = false;

        Mousetrap.bind('left', function () {
          var cardEl = $scope.cards[$scope.cards.length - $scope.peopleIndex - 1];
          var card = window.stack.getCard(cardEl);
          card.throwOut(-100, -50);
          $passOverlay = $(cardEl).children('.pass-overlay');
          $likeOverlay = $(cardEl).children('.like-overlay');
          pass(1);
          ga_storage._trackEvent('Keyboard', 'left');
        });

        Mousetrap.bind('right', function () {
          var cardEl = $scope.cards[$scope.cards.length - $scope.peopleIndex - 1];
          var card = window.stack.getCard(cardEl);
          card.throwOut(100, -50);
          $passOverlay = $(cardEl).children('.pass-overlay');
          $likeOverlay = $(cardEl).children('.like-overlay');
          like(1);
          ga_storage._trackEvent('Keyboard', 'right');
        });

        Mousetrap.bind('backspace', function() {
          $scope.undo();
          ga_storage._trackEvent('Keyboard', 'backspace');
        });
      }

      // randomize rotation
      $timeout(function() {
        $.each($scope.cards, function(idx, card) {
          var $card = $(card);
          var marginLeft = parseInt($card.css('margin-left'));
          $card.css('margin-left', '-' + (Math.floor(Math.random()*((marginLeft+10)-(marginLeft-10)+1)+(marginLeft-10))) + 'px')
              .css('transform', 'rotate(' + (Math.floor(Math.random()*(3+3+1)-3)) + 'deg)');
        });
      }, 0, false);
    };

    getPeople();

  });

  app.controller('LoginController', function LoginController($scope, $http, API) {
    $scope.loginUrl = 'https://m.facebook.com/dialog/oauth?client_id=464891386855067&redirect_uri=https://www.facebook.com/connect/login_success.html&scope=basic_info,email,public_profile,user_about_me,user_activities,user_birthday,user_education_history,user_friends,user_interests,user_likes,user_location,user_photos,user_relationship_details&response_type=token';
    $scope.fbAuthData = {};

    $scope.startLogin = function() {
      window.loginWindow = gui.Window.open($scope.loginUrl, {
        title: 'Login to Facebook',
        position: 'center',
        width: 400,
        height: 480,
        focus: true
      });
      var interval = window.setInterval(function() {
        if (window.loginWindow) {
          checkForToken(window.loginWindow.window, interval);
        }
      }, 500);
      window.loginWindow.on('closed', function() {
        window.clearInterval(interval);
        window.loginWindow = null;
      });
      ga_storage._trackEvent('Login', 'Login Started');
    };

    var tinderLogin = function() {
      API.login($scope.fbAuthData['fb_id'], $scope.fbAuthData['access_token']);
    };

    var checkForToken = function(loginWindow, interval) {
      if (loginWindow.closed) {
        window.clearInterval(interval);
      } else {
        var url = loginWindow.document.URL;
        var paramString = url.split("#")[1];
        if (!!paramString) {
          var allParam = paramString.split("&");
          for (var i = 0; i < allParam.length; i++) {
            var param = allParam[i].split("=");
            $scope.fbAuthData[param[0]] = param[1];
          }
          loginWindow.close();
          window.clearInterval(interval);
          getFBUserId($scope.fbAuthData['access_token']);
        }
      }
    };

    var getFBUserId = function(token) {
      var graphUrl = 'https://graph.facebook.com/me?access_token=' + token;
      $http.get(graphUrl)
          .success(function(data) {
            console.log(data);
            $scope.fbAuthData['fb_id'] = data.id;
            tinderLogin();
          })
          .error(function(data) {
            console.log(data);
          });
    }
  });

  app.directive('renderImagesDirective', function() {
    return function(scope, element, attrs) {
      if (scope.$last){
        scope.$emit('cardsRendered');
      }
    };
  });

  app.filter('bdayToAge', function() {
    return function(bday) {
      return moment.duration(moment().diff(moment(bday))).years();
    };
  });

  app.filter('emoji', function() {
    return function(string) {
      return twemoji.parse(string);
    };
  });

  // based off https://github.com/doukasd/AngularJS-Components
  // a directive to auto-collapse long text
  // in elements with the "dd-text-collapse" attribute
  app.directive('ddTextCollapse', ['$compile', function($compile) {

    return {
      restrict: 'A',
      scope: true,
      link: function(scope, element, attrs) {

        // start collapsed
        scope.collapsed = false;

        // create the function to toggle the collapse
        scope.toggle = function() {
          scope.collapsed = !scope.collapsed;
        };

        // wait for changes on the text
        attrs.$observe('ddTextCollapseText', function(text) {

          scope.collapsed = false;

          // get the length from the attributes
          var maxLength = scope.$eval(attrs.ddTextCollapseMaxLength);

          var countedChars = 0;
          var isInHtmlTag = false;
          var splitIdx = null;
          // this is only for not breaking the twemoji links
          // don't trust it for anything else
          for (var i = 0; i < text.length; i++) {
            if (countedChars > maxLength) {
              splitIdx = i;
              break;
            }
            if (text[i] === '<') {
              isInHtmlTag = true;
            }
            if (text[i] === '>') {
              isInHtmlTag = false;
            }
            if (!isInHtmlTag) {
              countedChars++;
            }
          }

          if (splitIdx && text.length > splitIdx) {
            // split the text in two parts, the first always showing
            var firstPart = String(text).substring(0, splitIdx);
            var secondPart = String(text).substring(splitIdx, text.length);

            // create some new html elements to hold the separate info
            var firstSpan = $compile('<span>' + firstPart + '</span>')(scope);
            var secondSpan = $compile('<span ng-if="collapsed">' + secondPart + '</span>')(scope);
            var moreIndicatorSpan = $compile('<span ng-if="!collapsed">&#8230; </span>')(scope);
            var lineBreak = $compile('<br ng-if="collapsed">')(scope);
            var toggleButton = $compile('<span class="collapse-text-toggle" ng-click="toggle()">{{collapsed ? "less" : "more"}}</span>')(scope);

            // remove the current contents of the element
            // and add the new ones we created
            element.empty();
            element.append(firstSpan);
            element.append(secondSpan);
            element.append(moreIndicatorSpan);
            element.append(lineBreak);
            element.append(toggleButton);
          } else {
            element.empty();
            element.append(text);
          }
        });
      }
    };
  }]);

  var $passOverlay, $likeOverlay;

  function pass(confidence) {
    applyOpacity($passOverlay, $likeOverlay, confidence);
  }

  function like(confidence) {
    applyOpacity($likeOverlay, $passOverlay, confidence);
  }

  function applyOpacity(applyEl, clearEl, confidence) {
    applyEl.css('opacity', confidence * (2 / 3));
    clearEl.css('opacity', 0);
  }

  // helpers
  capitalize = function (s)
  {
    return s[0].toUpperCase() + s.slice(1);
  }

  var debounce = function(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  };
})();
