exports.process = function(results) {
  for(var key in results) {
    puts(key + ': ' + results[key]);
  }
};