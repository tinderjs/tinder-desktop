(function() {
  var Swing = require('swing');
  var superLike = false;
  var module = angular.module('tinder-desktop.swipe', ['ngSanitize', 'tinder-desktop.api']);

  module.controller('SwipeController', function SwipeController($scope, $route, $timeout, $interval, $location, API, Cache) {
    API.getHistory();
    function GenerateHtmlStack(){
      var HtmlStack = document.querySelector(".main-photo-container");  
      
      while(HtmlStack.firstChild){
        HtmlStack.removeChild(HtmlStack.firstChild);
      }
      
      for(var i = 0; i < $scope.allPeople.length; i++){
        var card = document.createElement("div");
        var stampLike = document.createElement("i");
        stampLike.className = "fa fa-thumbs-o-up stampLike ng-hide";
        var stampPass = document.createElement("i");
        stampPass.className = "fa fa-thumbs-o-down stampPass ng-hide";
        card.appendChild(stampLike);
        card.appendChild(stampPass);
        HtmlStack.appendChild(card);
      }
      
      //Reverse the photos loadings (while need to cache the image to avoid the reload each time)
      var nodes = HtmlStack.childNodes;
      for(i = nodes.length - 1 ; i >= 0; i--) {
        (function(index,c){
          card.className = "ng-hide";
          var image = new Image();
          image.onload = function () {
            $scope.$apply(function () {
              c.style.backgroundImage = 'url("' + $scope.allPeople[index].photos[0].processedFiles[0].url+ '")';
              c.className = "main-photo tinder-card";
            });
          };
          image.src = $scope.allPeople[index].photos[0].processedFiles[0].url;
        })(i,nodes[i])
      }
    }
    
    function initCards(){
      GenerateHtmlStack();
  
      const config = {
        throwOutConfidence: (offset, element) => {
          return Math.min(Math.abs(offset) / 250, 1);
        }
      };
      $scope.cards = [].slice.call(document.querySelectorAll('.stack li'));
       
      window.stack = Swing.Stack(config);
      
      $scope.cards.forEach(function (targetElement) {
        window.stack.createCard(targetElement);
        targetElement.classList.add('in-deck');
      });

      window.stack.on('throwout', function (e) {
           var method = (e.throwDirection < 0) ? 'pass' : 'like';
           if(method == 'like' && superLike){
             method = 'superLike';
             superLike = 0;
           }
           $scope.apiQueue({
             method: method,
             user: $scope.allPeople[$scope.allPeople.length-1]});
             
           $scope.allPeople.pop();
           initCards();
           if($scope.allPeople.length == 3){
             preLoad('reload');
           }
           e.target.classList.remove('in-deck');
       });

      window.stack.on('throwin', function (e) {
           e.target.classList.add('in-deck');
       });
       
       window.stack.on('dragmove', function (e){
          if(e.throwDirection == 1){
            e.target.childNodes[0].className = "fa fa-thumbs-o-up stampLike";
            e.target.childNodes[1].className = "fa fa-thumbs-o-up stampPass ng-hide";
          }else{
            e.target.childNodes[1].className = "fa fa-thumbs-o-down stampPass";
            e.target.childNodes[0].className = "fa fa-thumbs-o-up stampLike ng-hide";
          }
       })
       
      window.stack.on('dragend', function (e){
          e.target.childNodes[0].className = "fa fa-thumbs-o-up stampLike ng-hide";
          e.target.childNodes[1].className = "fa fa-thumbs-o-up stampPass ng-hide";
       })
       
    }

    $scope.allPeople = [];
    $scope.apiInQueue;
    var queueTimer = null;

    API.getAccount().then(function(response){
      $scope.superLikesRemaining = '' + response.rating.super_likes.remaining;
      $scope.timeUntilSuperLike = response.rating.super_likes.resets_at;
    })

    $scope.likesRemaining = null;
    $interval(function() { $scope.likesRemaining = API.getLikesRemaining(); 
      $timeout(function() {
        $scope.$apply();
      });
    }, 1000);
    
    //Never use
    $scope.swapPhoto = function(index) {
      loadImage(index);
      $scope.allPeople[$scope.allPeople.length-1].photoIndex = index;
    };

    $scope.getCookie = function(cookieName) {
      return localStorage[cookieName];
    };
  
    function preLoad(){
      getPeople('preload');
    }
    
    var getPeople = function(preload) {
      if(Cache.get('locationUpdated')){
        Cache.put('people',null);
      }
      if(!Cache.get('people') || preload){
        API.people().then(function(people){
          if(preload){
            var cur = Cache.get('people');
            Cache.put('people',people.concat(cur));
          }else{
            Cache.put('people',people);    
          }
          setPeople(Cache.get('people'));
        });
      }else{
        setPeople(Cache.get('people'));
      }
    };
    var setPeople = function(people) {
      if (people && people.length) {
        $scope.allPeople = people;
        $.map($scope.allPeople, function(person) { person.photoIndex = 0; });
        initCards();
        $timeout(function() {
          $scope.$apply();
        });
      }
    };
    
    $scope.apiQueue = function(nextObject){
      if($scope.apiInQueue){
        API[$scope.apiInQueue.method]($scope.apiInQueue.user._id);
      }
      $scope.apiInQueue = nextObject;
    }
    
    $scope.undo = function() {
      $scope.allPeople.push($scope.apiInQueue.user);
      $scope.apiInQueue = null;
      initCards();
    }
    
    Mousetrap.bind('left', function (evt) {
      evt.preventDefault();
      var card = window.stack.getCard($scope.cards[$scope.cards.length-1]);
      if (card) {
        card.throwOut(-100, -50);
      }
    });
    
    Mousetrap.bind('right', function (evt) {
      evt.preventDefault();
      var card = window.stack.getCard($scope.cards[$scope.cards.length-1]);
      if (card) {
        card.throwOut(100, -50);
      }
    });

    Mousetrap.bind('shift+right', function (evt) {      
      if($scope.superLikesRemaining == '0'){
        var timeUntilSuperLike = $scope.timeUntilSuperLike
        var formattedTime = moment(timeUntilSuperLike).format('MMMM Do, h:mm:ss a')
        swal("Oops!", "Sorry, you are out of superlikes! \n Try again at " + formattedTime , "error");
        return false
      }
      superLike = true;
      var card = window.stack.getCard($scope.cards[$scope.cards.length-1]);
      if (card) {
        card.throwOut(100, -50);
      }
      var user = $scope.allPeople[$scope.allPeople.length-1];
      swal("Nice!", "You just superliked " + user.name + ", increasing your chance of a match by 3x!" , "success");
      return false
    });

    Mousetrap.bind('backspace', function(evt) {
      evt.preventDefault();
      $scope.undo();
    });

    Mousetrap.bind('up', function(evt) {
      evt.preventDefault();
      var numberOfPhotos = $scope.allPeople[$scope.allPeople.length-1].photos.length;
      var photoIndex = $scope.allPeople[$scope.allPeople.length-1].photoIndex;
      
      if(photoIndex == 0){
        $scope.allPeople[$scope.allPeople.length-1].photoIndex = numberOfPhotos - 1
      } else {
        $scope.allPeople[$scope.allPeople.length-1].photoIndex += -1
      }
      loadImage($scope.allPeople[$scope.allPeople.length-1].photoIndex);
    }); 

    Mousetrap.bind('down', function(evt) {
      evt.preventDefault();
      
      var numberOfPhotos = $scope.allPeople[$scope.allPeople.length-1].photos.length
      var photoIndex = $scope.allPeople[$scope.allPeople.length-1].photoIndex

      if(photoIndex == numberOfPhotos - 1){
        $scope.allPeople[$scope.allPeople.length-1].photoIndex = 0
      } else {
        $scope.allPeople[$scope.allPeople.length-1].photoIndex += 1
      }
      loadImage($scope.allPeople[$scope.allPeople.length-1].photoIndex);
    });
    
    function loadImage(i){
      var card = $scope.cards[$scope.cards.length-1];
      (function(index,c){
      var image = new Image();
      image.onload = function () {
        $scope.$apply(function () {
          card.style.backgroundImage = 'url("' + $scope.allPeople[$scope.allPeople.length-1].photos[index].processedFiles[0].url+ '")';
          card.className = "in-deck";
        });
      };
      image.src = $scope.allPeople[$scope.allPeople.length-1].photos[index].processedFiles[0].url;
      })(i,card)
    }
    
    $scope.$on('$locationChangeStart', function(event, next, current) {
      if($scope.apiInQueue){
        API[$scope.apiInQueue.method]($scope.apiInQueue.user._id);
      }
    });
    
    getPeople();
  });
  
})();
