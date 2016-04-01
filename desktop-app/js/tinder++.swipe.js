(function() {
  var gui = require('nw.gui');
  var module = angular.module('tinder++.swipe', ['ngAutocomplete', 'ngSanitize', 'emoji', 'tinder++.api']);

  module.controller('SwipeController', function SwipeController($scope, $timeout, API) {
    $scope.allPeople = [];
    $scope.peopleIndex = 0;
    $scope.apiQueue = [];
    var queueTimer = null;

    $scope.swapPhoto = function(index) {
      $scope.allPeople[$scope.peopleIndex].photoIndex = index;
    };

    $scope.getCookie = function(cookieName) {
      return localStorage[cookieName];
    };

    $scope.$on('cardsRendered', function() {
      initCards();
    });

    var getPeople = function() {
      flushApiQueue();
      API.people().then(setPeople);
      ga_storage._trackEvent('People', 'Loading more people');
      window._rg.record('swipe', 'loading more people', { origin: 'tinderplusplus' });
    };

    var setPeople = function(people) {
      if (people && people.length) {
        $scope.peopleIndex = 0;
        $scope.allPeople = people;
        $.map($scope.allPeople, function(person) { person.photoIndex = 0; });
        $timeout(function() {
          $scope.$apply();
        });
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
      $timeout(function() {
        $scope.$apply();
      });
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
      $timeout(function() {
        $scope.$apply();
      });
    };

    $scope.undo = function() {
      $scope.apiQueue.pop();
      $scope.peopleIndex--;
      var cardEl = $scope.cards[$scope.cards.length - $scope.peopleIndex - 1];
      $(cardEl).fadeIn(250, function() {
        var card = window.stack.getCard(cardEl);
        card.throwIn(0, 0);
      });
      $timeout(function() {
        $scope.$apply();
      });
      ga_storage._trackEvent('Undo', 'Clicked Undo');
      window._rg.record('swipe', 'clicked undo', { origin: 'tinderplusplus' });
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
        $timeout(function() {
          $scope.$apply();
        });
        $(e.target).fadeOut(500);
        if ($scope.peopleIndex >= $scope.allPeople.length) {
          getPeople();
        }
        ga_storage._trackEvent('Swipe', (e.throwDirection < 0) ? 'pass' : 'like');

        if (e.throwDirection > 0) {
          window._rg.record('swipe', 'like', { origin: 'tinderplusplus' });
        } else {
          window._rg.record('swipe', 'pass', { origin: 'tinderplusplus' });
        }
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
        // console.log('running firstload');
        firstLoad = false;

        Mousetrap.bind('left', function () {
          var cardEl = $scope.cards[$scope.cards.length - $scope.peopleIndex - 1];
          var card = window.stack.getCard(cardEl);
          if (!!card) {
            card.throwOut(-100, -50);
          }
          $passOverlay = $(cardEl).children('.pass-overlay');
          $likeOverlay = $(cardEl).children('.like-overlay');
          pass(1);
          ga_storage._trackEvent('Keyboard', 'left');
          window._rg.record('keyboard', 'left', { origin: 'tinderplusplus' });
        });

        Mousetrap.bind('right', function () {
          var cardEl = $scope.cards[$scope.cards.length - $scope.peopleIndex - 1];
          var card = window.stack.getCard(cardEl);
          if (!!card) {
            card.throwOut(100, -50);
          }
          $passOverlay = $(cardEl).children('.pass-overlay');
          $likeOverlay = $(cardEl).children('.like-overlay');
          like(1);
          ga_storage._trackEvent('Keyboard', 'right');
          window._rg.record('keyboard', 'right', { origin: 'tinderplusplus' });
        });
		
		Mousetrap.bind('up', function () {
          var cardEl = $scope.cards[$scope.cards.length - $scope.peopleIndex - 1];
          var card = window.stack.getCard(cardEl);
          if (!!card) {
            card.throwOut(0, -100);
          }/* 
          $passOverlay = $(cardEl).children('.pass-overlay');
          $likeOverlay = $(cardEl).children('.like-overlay'); */
          superLike(1);
          ga_storage._trackEvent('Keyboard', 'up');
          window._rg.record('keyboard', 'up', { origin: 'tinderplusplus' });
        });

        Mousetrap.bind('backspace', function(evt) {
          $scope.undo();
          ga_storage._trackEvent('Keyboard', 'backspace');
          window._rg.record('keyboard', 'backspace', { origin: 'tinderplusplus' });
          evt.preventDefault();
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

  //helper
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

  module.directive('renderImagesDirective', function() {
    return function(scope, element, attrs) {
      if (scope.$last){
        scope.$emit('cardsRendered');
      }
    };
  });

  module.filter('bdayToAge', function() {
    return function(bday) {
      return moment.duration(moment().diff(moment(bday))).years();
    };
  });

  module.filter('pingToAgo', function() {
    return function(ping) {
      return moment(ping).fromNow();
    };
  });

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
})();
