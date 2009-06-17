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

        puts(req.uri.path);

        if (req.uri.path == '/result') {
          req.setBodyEncoding('utf8');
          var body = '';
          req.onBody = function (chunk) {
            body += chunk;
          };
          req.onBodyComplete = function() {
            return result(body, req, res);
          };
        } else if (req.uri.path == '/tick') {
          return tick(req, res);
        } else if (match = req.uri.path.match(/^\/file/)){
          return sendFile(req.uri.params.path, res);
        } else if (match = req.uri.path.match(/^\/static\/(.*)/)){
          return sendStaticFile(match[1], res);
        } else {
          return boot(req, res);
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

  function sendData(data, contentType, res) {
    res.sendHeader(200, [["Content-Type", contentType]]);
    res.sendBody(data);
    res.finish();
  }

  function sendStaticFile(filename, res) {
    sendFile(publicPath(filename), res);
  }

  function sendFile(path, res) {
    puts("serving file '" + path + "'");
    var extension = path.match(/.*(js|html)$/)[1];
    var contentType = extension == 'js' ? 'text/javascript' : 'text/html';
    loadUtfFile(path, function(data) {
      sendData(data, contentType, res);
    });
  }

  // actions

  function result(body, req, res) {
    config.process(req, JSON.parse(body));
    sendNothing(res);
  }

  function boot(req, res) {
    
    var browser = getBrowserState(req);
    browser.lastSeenAt = new Date().getTime();
    
    var html = loadUtfFile(publicPath('runner.html'), function(data) {
      var scripts = '';
      var paths = expandPaths(config.testPaths);
      for (var i=0,l=paths.length; i<l; i++) {
        scripts += '<script type="text/javascript" src="/files?path=' + encodeURIComponent(paths[i]) + '"></script>' + "\n"
      }
      var page = data.replace('{{ scripts }}', scripts);
      sendData(page, 'text/html', res);
    });
  }

  function tick(req, res) {

    var paths = expandPaths(config.testPaths);
    var fileContent = '';
    var browser = getBrowserState(req);
    var now = new Date().getTime();
    
    function checkModTime(index) {
      node.fs.stat(paths[index], function(status, stats) {
        if (typeof(browser.lastSeenAt) == 'undefined' || browser.lastSeenAt < stats['mtime'].getTime()) {
          browser.lastSeenAt = now;
          sendData(JSON.stringify({reload: true}), 'text/javascript', res);
        } else {
          var nextIndex = index + 1;
          if (nextIndex < paths.length) {
            checkModTime(nextIndex);
          } else {
            sendData(JSON.stringify({reload: false}), 'text/javascript', res);
          }
        }
      });
    }
    checkModTime(0);
  }
  
};