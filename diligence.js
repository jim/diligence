var http = require('http');
var sys = require('sys');
var url = require('url');
var fs = require('fs');

exports.createServer = function(setupCallback) {
  var browsers = [], files = [];
  var config = {};
  setupCallback(config);
  applyDefaults(config);
  
  start();
  
  function start() {
    var server = http.createServer(function (req, res) {

        parsed = url.parse(req.url, true);

        debug('Processing request: ' + parsed.href);

        if (parsed.pathname == '/result') {
          req.setEncoding('utf8');
          var body = '';
          req.onBody = function (chunk) {
            body += chunk;
          };
          req.onBodyComplete = function() {
            return result(body, req, res);
          };
        } else if (parsed.pathname == '/tick') {
          return tick(req, res);
        } else if (match = parsed.pathname.match(/^\/file/)){
          return sendFile(parsed.query.path, res);
        } else if (match = parsed.pathname.match(/^\/static\/(.*)/)){
          return sendStaticFile(match[1], res);
        } else {
          return boot(req, res);
        }

      });

    if (server) {
      server.listen(config['port']);
      sys.puts("diligence is running on port " + config['port'].toString() + ".");
    }
  }
  
  function debug(object) {
    if (config.debug) {
      if(typeof(object) == 'string') {
        sys.puts(object);
      } else {
        for (var key in object) {
          sys.debug(key + ": " + object[key]);
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
    
    if (typeof(config.runnerPath) == 'undefined') {
      config.runnerPath = publicPath('runner.html');
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

  function getBrowserName(req) {
    var ua = getUA(req);
    
    try {
      if (ua.match(/Chrome/)) {
        return 'Chrome ' + ua.match(/Chrome\/([\d\.]+)/)[1];
      } else if (ua.match(/Firefox/)) {
        return 'Firefox ' + ua.match(/Firefox\/([\d\.]+)/)[1];
      } else if (ua.match(/Safari/)) {
        return 'Safari ' + ua.match(/Version\/([^ ]+) Safari\/[\d\.]+/)[1];      
      } else if (ua.match(/Opera/)) {
        return 'Opera ' + ua.match(/Opera\/([\d\.]+)/)[1];
      }
    } catch(e) {
      return "Unknown Browser: '" + ua + "'";
    }
    
    return ua;
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

  // path and file handling
  
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
    fs.readFile(path, 'utf8', function(error, data) {
      callback(data);
    });
  }

  // responses

  function sendNothing(res) {
    res.writeHead(200, []);
    res.finish();
  }

  function sendData(data, contentType, res) {
    res.writeHead(200, [["Content-Type", contentType]]);
    res.write(data);
    res.end();
  }

  function sendStaticFile(filename, res) {
    sendFile(publicPath(filename), res);
  }

  function sendFile(path, res) {
    debug("serving file '" + path + "'");
    var extension = path.match(/.*(js|html)$/)[1];
    var contentType = extension == 'js' ? 'text/javascript' : 'text/html';
    loadUtfFile(path, function(data) {
      sendData(data, contentType, res);
    });
  }

  // actions

  function result(body, req, res) {
    var result = JSON.parse(body);
    var browser = {
      userAgent: getUA(req),
      name: getBrowserName(req)
    };
    config.process(browser, result.data);
    sendNothing(res);
  }

  function boot(req, res) {
    
    var browser = getBrowserState(req);
    browser.lastSeenAt = new Date().getTime();
    
    var html = loadUtfFile(config.runnerPath, function(data) {
      var scripts = '';
      var paths = expandPaths(config.testPaths);

      paths.unshift(publicPath('runner.js'));      
      paths.unshift(publicPath('ajax.js'));
      paths.unshift(publicPath('json2.js'));
      
      for (var i=0,l=paths.length; i<l; i++) {
        scripts += '<script type="text/javascript" src="/files?path=' + encodeURIComponent(paths[i]) + '"></script>' + "\n"
      }
      
      var page = data.replace('</head>', scripts + '</head>');
      sendData(page, 'text/html', res);
    });
  }

  function tick(req, res) {

    var paths = expandPaths(config.testPaths);
    var fileContent = '';
    var browser = getBrowserState(req);
    var now = new Date().getTime();
    
    function checkModTime(index) {
      fs.stat(paths[index], function(status, stats) {
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