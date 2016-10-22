(function() {
  module = angular.module('tinder-desktop.autoliker', ['ngAutocomplete','ngRangeSlider', 'ngSanitize']);

  module.controller('AutolikerController', function($scope, $translate, $timeout, $interval, API) {

    function getYearsOld(girlsBirthday){
      let todaysDate = new Date();
      let girlsDate = new Date(girlsBirthday);
      var timeDiff = Math.abs(todaysDate.getTime() - girlsDate.getTime());
      var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
      var diffYears = Math.floor(diffDays/365);
      return diffYears
    }

    $scope.likedGirls = [];

    $scope.allowedToAutolike = true;

    $scope.stopAutoliking = function(){
      $scope.allowedToAutolike = false;
    };

    function likeGirls(){

      API.autoPeople(10).then(function(recResponse){
        // console.log(JSON.stringify(recResponse, 2, 2));
        recResponse.results.forEach(function(girl, index){
          let timeout = index * 2000;

          setTimeout(function(){
            let age = getYearsOld(girl.birth_date);
            let name = girl.name;
            let distance = (girl.distance_mi * 1.6).toFixed(1);
            let userId = girl._id;

            API.autoLike(girl._id).then(function(likeResponse){
              // console.log(JSON.stringify(likeResponse, 2, 2));
            });

            var girlObject = {
              name,
              age,
              distance,
              userId
            };

            $scope.likedGirls.push(girlObject);

          }, timeout)
        })
      })
    }

    function reboot(){
      if(!$scope.allowedToAutolike) return;
      // begin liking girls
      likeGirls();
      setTimeout(function(){
          reboot()
        }, 30000 )
    }


    $scope.autoLikeGirls = function(){
      $scope.allowedToAutolike = true;

      reboot();
    }


  });
})();
