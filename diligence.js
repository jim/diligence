exports.diligence = {};

exports.diligence.Server = function(setupCallback) {
  var browsers = [], files = [];
  var config = {};
  setupCallback(config);
  applyDefaults(config);
  
  start();
  
  var debug = function(object) {
    if (config.debug) {
      if(typeof(object) == 'string') {
        puts(object);
      } else {
        for (var key in object) {
          puts(key + ": " + object[key]);
        }
      }
    }
  }
  
  function applyDefaults(config) {
    var defaults = {
      debug: false,
      publicPath: 'public',
      port: 5678,
      testPaths: [],
      collectPath: ''
    }
    
    for (var key in defaults) {
      if (typeof(config[key]) == 'undefined') {
        config[key] = defaults[key];
      }
    }
  }
  
  function start() {
    var server = new node.http.Server(function (req, res) {

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

    }).listen(config['port']);

    if (server) {
      puts("diligence is running on port " + config['port'].toString() + ".");
    }
  }


  function getUA(req) {
    var headers = req.headers;
    for (var i=0,l=headers.length; i<l; i++) {
      if (headers[i][0] == 'User-Agent') {
        return headers[i][1];
      }
    }
  }

  function getBrowserState(req) {
    var ua = getUA(req);
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

  
  function expandPaths(paths) {
    if (typeof(paths) == 'string') { paths = [paths] }
    
    var pathList = [];
    for (var i=0,l=paths.length; i<l; i++) {
      pathList.push(paths[i]);
    }
    return pathList;
  }


  function publicPath(path) {
    return config.publicPath + '/' + path;
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

  // responses

  function sendNothing(res) {
    res.sendHeader(200, []);
    res.finish();
  }

  function sendFile(data, contentType, res) {
    res.sendHeader(200, [["Content-Type", contentType]]);
    res.sendBody(data);
    res.finish();
  }

  function sendStaticFile(filename, res) {
    puts("serving static file '" + publicPath(filename) + "'");
    var extension = filename.match(/[a-z0-9]*\.(js|html)/)[1];
    var contentType = extension == 'js' ? 'text/javascript' : 'text/html';
    loadUtfFile(publicPath(filename), function(data) {
      sendFile(data, contentType, res);
    });
  }

  // actions

  function result(req, res) {
    config.process(req, JSON.parse(req.uri.params['payload']));
    sendNothing(res);
  }

  function code(req, res) {

    var paths = expandPaths(config.testPaths);
    var i = 0;
    var fileContent = '';
    var browser = getBrowserState(req);
    
    function checkModTime(index) {
      node.fs.stat(paths[i], function(status, stats) {        
        if (typeof(browser.lastSeenAt) == 'undefined' || browser.lastSeenAt < stats['mtime'].getTime()) {
          browser.lastSeenAt = new Date().getTime();
          debug("sending new code");
          i = 0; // reset loop so code loading starts at the top
          loadFileAt(index);
        } else {
          var nextIndex = index + 1;
          if (nextIndex < paths.length) {
            checkModTime(nextIndex);
          } else {
            sendNothing(res);
          }
        }
      });
    }
    
    function loadFileAt(index) {
      loadUtfFile(paths[index], function(data) {
        fileContent += data;
        var nextIndex = index + 1;
        if (nextIndex < paths.length) {
          loadFileAt(nextIndex);
        } else {
          respond();
        }
      });
    }
    
    function respond() {
      loadUtfFile(config.collectPath, function(collectCode) {
        var data = {test: fileContent, collect: collectCode};
        sendFile(JSON.stringify(data), 'text/javascript', res);
      });
    }
    
    checkModTime(0);

  }
  
};