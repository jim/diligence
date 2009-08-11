include('../diligence.js');

function onLoad() {
    
  new diligence.Server(function(setup) {
    setup.publicPath = '../public';
    setup.testPaths = ['tests/tests.js', 'tests/respond.js'];
    setup.collectPath = 'tests/collect.js';
    setup.process = function(req, results) {
      puts('* You can customize the process function in your setup block to handle test results');
      for(var key in results) {
        puts(key + ': ' + results[key]);
      }
    };
  });

}

