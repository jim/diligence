var interval;
function go() {
  interval = setInterval(run, 1000);
};

function run() {
  microAjax('/tick', function(json){
    if (json != '') {
      clearInterval(interval);
      var response = JSON.parse(json);
      try {
        eval(response.test);
      } catch(exception) {
        var exception = {
          message: exception.message
        }
      } finally {
        var data = eval(response.collect);
        if (exception) {
          data.exception = exception;
        }
        var payload = encodeURIComponent(JSON.stringify(data));
        microAjax('/result?payload=' + payload, function(data) {
          go();
        });
      }
    }
  });
};