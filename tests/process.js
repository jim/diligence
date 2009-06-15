exports.process = function(results) {
  puts('* You can customize the process function in tests/process.js to handle the results of your tests');
  for(var key in results) {
    puts(key + ': ' + results[key]);
  }
};