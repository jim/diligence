var browsers = [];

var debug = function(object) {
  for (var key in object) {
    puts(key + ": " + object[key]);
  }
};

var getUA = function(request) {
  var headers = request.headers;
  for (var i=0,l=headers.length; i<l; i++) {
    if (headers[i][0] == 'User-Agent') {
      return headers[i][1];
    }
  }
};

var getStatus = function(headers) {
  
  var ua = getUA(headers);
  for (var i=0,l=browsers.length; i<l; i++) {
    if (browsers[i][0] == ua) {
      puts('found ' + ua);
      return browsers[i][1];
    }
  }
  var status = {};
  browsers.push([ua, status]);
  puts('adding ' + ua);
  return status;
};

var loadUtfFile = function(path, callback) {
  node.fs.stat(path, function(status, stats) {
      var size = stats['size'];
      var file = new node.fs.File({encoding: 'utf8'});
      file.open(path, "r+");
      file.read(size, 0, function(data) {
        callback(data);
      });
  });
};

// actions

var result = function(req, res) {
  var status = getStatus(req);

  if (req.uri.params['success'] == '1') {
    puts('All tests passed.');
  } else {
    puts('There was a failure');
  }
  res.sendHeader(200, []);
  res.finish();
};

var tick = function(req, res) {
  loadUtfFile('tests.js', function(data) {
    res.sendHeader(200, [["Content-Type", "text/javascript"]]);
    res.sendBody(data);
    res.finish();
  });
};

var boot = function(req, res) {
  loadUtfFile('runner.html', function(data) {
    res.sendHeader(200, [["Content-Type", "text/html"]]);
    res.sendBody(data);
    res.finish();
  });
};

// server

new node.http.Server(function (req, res) {
  
  // puts(req.uri.path);

  if (req.uri.path == '/result') {
    return result(req, res);
  } else if (req.uri.path == '/tick') {
    return tick(req, res);
  } else {
    return boot(req, res);
  }
  
  res.sendHeader(200, [["Content-Type", "text/plain"]]);
  res.sendBody("Hello World");
  res.finish();

}).listen(5678);

puts("Server running at http://127.0.0.1:5678/");