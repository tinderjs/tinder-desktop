(function() {
  var tinder = require('tinder');
  var client = new tinder.TinderClient();
  var remote = require('remote');
  var Cleverbot = require('cleverbot-node');



  // if a token returned from tinder is in localstorage, set that token and skip auth
  if (localStorage.tinderToken) { client.setAuthToken(localStorage.tinderToken); }

  angular.module('tinder-desktop.cleverbot', []).factory('Cleverbot', function($q) {
    var handleError = function(err, callbackFn) {


      console.log('ERROR!!!!');
      console.log(err);

      (callbackFn || angular.noop)(err);
    };

    var cleverBot = new Cleverbot;

    var CleverbotAPI = {};

    function cleverbotWriteAsync(message){
      return new Promise(function(resolve, reject){
        cleverBot.write(message, resolve, reject);
      });
    }

    function cleverbotPrepareAsync(){
      return new Promise(function(resolve, reject){
        Cleverbot.prepare(resolve, reject);
      });
    }

    function getResponse(message) {
      cleverbotPrepareAsync().then(function () {
        return cleverbotWriteAsync(message).then(function(response){
          console.log(response.message);
        });
      })
    }

    CleverbotAPI.getResponse = function(message) {
      return $q(function (resolve, reject) {
        return cleverbotPrepareAsync().then(function () {
          return cleverbotWriteAsync(message).then(function(response){
            resolve(response.message);
          });
        })

        // client.getAccount(function(err, res, data) {
        //   if (!!err) {
        //     handleError(err, reject);
        //     return;
        //   }
        //   if (res === null) {
        //     handleError('userInfo result is null', reject);
        //     return;
        //   }
        //   // console.log(JSON.stringify(res));
        //   resolve(res);
        // });
      });
    };

    return CleverbotAPI;



    getResponse('hello');

    return 'Fred';

    // async function getFourResponses(message) {
    //   // initiate variables;
    //   let responses = [];
    //
    //   // loop through and get the four responses;
    //   for(var i = 0; i < 4; i++){
    //     let response = await cleverbotWriteAsync(message);
    //     responses.push(response.message);
    //
    //     // when we've got the last one;
    //     if(i === 3){
    //       return responses;
    //     }
    //   }
    // }

  });
})();
