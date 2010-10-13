// Based on microAjax

var ajax = function(url, callbackFunction) {
       this.bindFunction = function (caller, object) {
               return function() {
                       return caller.apply(object, [object]);
               };
       };

       this.stateChange = function (object) {
               if (this.request.readyState==4) {
                   // if (req.status == 200) {
                       this.callbackFunction(this.request);
                   // }
               }
       };

       this.getRequest = function() {
               if (window.ActiveXObject)
                       return new ActiveXObject('Microsoft.XMLHTTP');
               else if (window.XMLHttpRequest)
                       return new XMLHttpRequest();
               return false;
       };

       this.postBody = (arguments[2] || "");

       this.callbackFunction=callbackFunction;
       this.url=url;
       this.request = this.getRequest();

       if(this.request) {
               var req = this.request;
               req.onreadystatechange = this.bindFunction(this.stateChange, this);

               if (this.postBody!=="") {
                       req.open("POST", url, true);
                       req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                       req.setRequestHeader('Content-type', 'application/json');
                       req.setRequestHeader('Connection', 'close');
               } else {
                       req.open("GET", url, true);
               }

               req.send(this.postBody);
       }
}