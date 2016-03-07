(function() {
  angular.module('emoji', []).filter('emoji', function() {
    return twemoji.parse.bind(twemoji);
  });
})()
