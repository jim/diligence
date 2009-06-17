var diligence = (function() {

  var interval;

  function wait() {
    interval = setInterval(tick, 1000);
  }

  function tick() {  
    new ajax('/tick', function(request){
      var json = request.responseText;
      if (json != '') {
        response = JSON.parse(json);
        if (response.reload) {
          clearInterval(interval);
          document.location.reload();
        }
      }
    });
  };

  function respond(result) {
    var payload = JSON.stringify(result);
    new ajax('/result', function(request) {
      wait();
    }, payload);
  }

  return {
    respond: respond
  }
})();