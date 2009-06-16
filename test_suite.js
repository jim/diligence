include('diligence.js');

function onLoad() {
    
  new diligence.Server(function(setup) {
    setup.debug = true;
    setup.port = 5678;
    setup.testPaths ='tests/tests.js';
    setup.collectPath ='tests/collect.js',
    setup.process = function(req, results) {
      puts('* You can customize the process function to handle the results of your tests');
      for(var key in results) {
        puts(key + ': ' + results[key]);
      }
    };
  });

}

