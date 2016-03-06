(function() {
  angular.module('emoji', []).filter('emoji', function() {
    if (process.platform === 'darwin') {
      return function(string) { return string; };
    } else {
      return twemoji.parse.bind(twemoji);
    }
  });
})()
