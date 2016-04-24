(function() {
  var superLike;
  var module = angular.module('tinder-desktop.swipe', ['ngAutocomplete', 'ngSanitize', 'tinder-desktop.api', 'tinder-desktop.common']);

  module.controller('SwipeController', function SwipeController($scope, $timeout, $interval, $location, API) {
    $scope.allPeople = [];
    $scope.peopleIndex = 0;
    $scope.apiQueue = [];
    var queueTimer = null;

    API.getAccount().then(function(response){
      $scope.superLikesRemaining = '' + response.rating.super_likes.remaining;
      $scope.timeUntilSuperLike = response.rating.super_likes.resets_at;
    })

    $scope.likesRemaining = null;
    $interval(function() { $scope.likesRemaining = API.getLikesRemaining(); }, 1000);

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
    };

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
        var method;
        if(superLike === true){
          API.superLike(user._id).then(function(response){
            $scope.superLikesRemaining = '' + response.super_likes.remaining;
          })
        } else {
          method = (e.throwDirection < 0) ? 'pass' : 'like'
          addToApiQueue({
            method: method,
            user: user
          });
        }

        superLike = false;
        $scope.peopleIndex++;
        $timeout(function() {
          $scope.$apply();
        });
        $(e.target).fadeOut(500);
        if ($scope.peopleIndex >= $scope.allPeople.length) {
          getPeople();
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

      Mousetrap.bind('left', function (evt) {
        evt.preventDefault()
        var location = $location.path()
        if( location != '/swipe/' ) return

        var cardEl = $scope.cards[$scope.cards.length - $scope.peopleIndex - 1];
        var card = window.stack.getCard(cardEl);
        if (!!card) {
          card.throwOut(-100, -50);
        }
        $passOverlay = $(cardEl).children('.pass-overlay');
        $likeOverlay = $(cardEl).children('.like-overlay');
        pass(1);
      });

      Mousetrap.bind('right', function (evt) {
        evt.preventDefault()
        var location = $location.path()
        if( location != '/swipe/' ) return

        var user = $scope.allPeople[$scope.peopleIndex];
        var cardEl = $scope.cards[$scope.cards.length - $scope.peopleIndex - 1];
        var card = window.stack.getCard(cardEl);
        if (!!card) {
          card.throwOut(100, -50);
        }
        $passOverlay = $(cardEl).children('.pass-overlay');
        $likeOverlay = $(cardEl).children('.like-overlay');
        like(1);
      });

      Mousetrap.bind('shift+right', function (evt) {
        var location = $location.path()
        if( location != '/swipe/' ) return
        
        var user = $scope.allPeople[$scope.peopleIndex];

        if($scope.superLikesRemaining == '0'){
          var timeUntilSuperLike = $scope.timeUntilSuperLike
          var formattedTime = moment(timeUntilSuperLike).format('MMMM Do, h:mm:ss a')
          swal("Oops!", "Sorry, you are out of superlikes! \n Try again at " + formattedTime , "error");
          return false
        }

        superLike = true;

        var cardEl = $scope.cards[$scope.cards.length - $scope.peopleIndex - 1];
        var card = window.stack.getCard(cardEl);
        if (!!card) {
          card.throwOut(100, -50);
        }
        $passOverlay = $(cardEl).children('.pass-overlay');
        $likeOverlay = $(cardEl).children('.like-overlay');
        like(1);
        swal("Nice!", "You just superliked " + user.name + ", increasing your chance of a match by 3x!" , "success");
        return false
      });

      Mousetrap.bind('backspace', function(evt) {
        evt.preventDefault();
        var location = $location.path()
        if( location != '/swipe/' ) return

        $scope.undo();
      });

      Mousetrap.bind('up', function(evt) {
        evt.preventDefault();
        var location = $location.path()
        if( location != '/swipe/' ) return

        // someone has said to go to the next picture, 
        // accomplish by increasing the current length by 1
        var numberOfPhotos = $scope.allPeople[$scope.peopleIndex].photos.length
        var photoIndex = $scope.allPeople[$scope.peopleIndex].photoIndex

        // they clicked it while on the last photo, send it to the top 
        if(photoIndex == 0){
          $scope.allPeople[$scope.peopleIndex].photoIndex = numberOfPhotos - 1
        } else {
          $scope.allPeople[$scope.peopleIndex].photoIndex += -1
          return
        }
      }); 

      Mousetrap.bind('down', function(evt) {
        evt.preventDefault();
        var location = $location.path()
        if( location != '/swipe/' ) return

        // someone has said to go to the next picture, 
        // accomplish by increasing the current length by 1
        var numberOfPhotos = $scope.allPeople[$scope.peopleIndex].photos.length
        var photoIndex = $scope.allPeople[$scope.peopleIndex].photoIndex

        // they clicked it while on the last photo, send it to the top 
        if(photoIndex == numberOfPhotos - 1){
          $scope.allPeople[$scope.peopleIndex].photoIndex = 0
        } else {
          $scope.allPeople[$scope.peopleIndex].photoIndex += 1
          return
        }
      }); 

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
