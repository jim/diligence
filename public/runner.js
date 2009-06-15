var interval;
function go() {
    interval = setInterval(run, 1000);
};

function run() {
   microAjax('/tick', function(json){
       if (response != '') {
           clearInterval(interval);
           var response = JSON.parse(json);
           try {
               eval(response.code);
               var result = eval(response.collect);
               microAjax('/result?success=1', function(data) {
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