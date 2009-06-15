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
               var result = encodeURIComponent(JSON.stringify(eval(response.collect)));
               microAjax('/result?success=1&payload=' + result, function(data) {
                   go();
               });
           } catch(exception) {
               var message = exception.message;
               microAjax('result?success=0&message=' + message, function(data) {
                  go(); 
               });
           }
       }
   });
};