(function() {
  module = angular.module('tinder-desktop.autoliker', ['ngAutocomplete','ngRangeSlider', 'ngSanitize']);

  module.controller('AutolikerController', function($scope, $translate, $timeout, $interval, API) {

    $scope.likedGirls = [{name: 'Suzie', age: '23', distance: '8 km'}];

    function likeAGirl(){
      API.likeAGirl().then(function(response){

      })
    }

    function fred(){
      setTimeout(function(){
          console.log('hello');

          var string = 'fred';
          string = string + '1';

          $scope.likedGirls.push(string);

          fred();



          // API.().then(function(response){
          //   console.log(r)
          // })
        },
        5000 )
    }


    $scope.autoLikeGirls = function(){
      fred();
    }


  });
})();
