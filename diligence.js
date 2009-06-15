var options = {
  debug: false
};

var browsers = [];


function debug(object) {
  if (options.debug) {
    if(typeof(object) == 'string') {
      puts(object);
    } else {
      for (var key in object) {
        puts(key + ": " + object[key]);
      }
    }
  }
}

function getUA(request) {
  var headers = request.headers;
  for (var i=0,l=headers.length; i<l; i++) {
    if (headers[i][0] == 'User-Agent') {
      return headers[i][1];
    }
  }
}

function getStatus(headers) {
  
  var ua = getUA(headers);
  for (var i=0,l=browsers.length; i<l; i++) {
    if (browsers[i][0] == ua) {
      debug('found ' + ua);
      return browsers[i][1];
    }
  }
  var status = {};
  browsers.push([ua, status]);
  debug('adding ' + ua);
  return status;
}

function loadUtfFile(path, callback) {
  node.fs.stat(path, function(status, stats) {
      var size = stats['size'];
      var file = new node.fs.File({encoding: 'utf8'});
      file.open(path, "r+");
      file.read(size, 0, function(data) {
        callback(data);
      });
  });
}

// actions

function result(req, res) {
  if (req.uri.params['success'] == '1') {
    puts('All tests passed.');
  } else {
    puts('There was a failure');
  }
  sendNothing(res);
}

function code(req, res) {

  function respond(codeUpdatedAt) {
    var status = getStatus(req);
    if (typeof(status.lastSeenAt) == 'undefined' || status.lastSeenAt < codeUpdatedAt) {
      debug("sending new code");
      loadUtfFile('tests.js', function(data) {
        res.sendHeader(200, [["Content-Type", "text/javascript"]]);
        res.sendBody(data);
        res.finish();
      });
    } else {
      sendNothing(res);
    }
    status.lastSeenAt = new Date().getTime();
  }; 

  node.fs.stat('tests.js', function(status, stats) {
    respond(stats['mtime'].getTime());
  });
  
}

function sendNothing(res) {
  res.sendHeader(200, []);
  res.finish();
}

function sendStaticFile(filename, res) {
    puts("serving static file '" + filename + "'");
    var extension = filename.match(/[a-z0-9]*\.(js|html)/)[1];
    var contentType = extension == 'js' ? 'text/javascript' : 'text/html';
    loadUtfFile('public/' + filename, function(data) {
      res.sendHeader(200, [["Content-Type", contentType]]);
      res.sendBody(data);
      res.finish();
    });
}

// server

function startServer() {
    new node.http.Server(function (req, res) {

      // puts(req.uri.path);

      if (req.uri.path == '/result') {
        return result(req, res);
      } else if (req.uri.path == '/tick') {
        return code(req, res);
      } else if (match = req.uri.path.match(/^\/static\/(.*)/)){
        return sendStaticFile(match[1], res);
      } else {
        return sendStaticFile('runner.html', res);
      }

    }).listen(5678);

    puts("diligence is running on port 5678.");
}

// boot
startServer();