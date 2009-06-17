var diligence = (function() {

  var interval;

  function wait() {
    interval = setInterval(tick, 1000);
  }

  function tick() {  
    new ajax('/tick', function(request){
      if (request.status == 200) {
        response = JSON.parse(request.responseText);
        if (response.reload) {
          clearInterval(interval);
          document.location.reload();
        }
      } else {
        clearInterval(interval);
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