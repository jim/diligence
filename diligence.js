var express = require('express');
var sys = require('sys');
var url = require('url');
var fs = require('fs');
var path = require('path');

exports.createServer = function(setupCallback) {
  var browsers = [], files = [];
  var config = {};
  setupCallback(config);
  applyDefaults(config);
  
  start();
  
  function start() {
    var app = express.createServer();
    
    app.use(express.bodyDecoder());
    
    app.get('/', function(request, response) {
      var browser = getBrowserState(request);
      browser.lastSeenAt = new Date().getTime();
    
      var html = loadUtfFile(path.join(config.root, config.runnerPath), function(data) {
        var scripts = '';
        var paths = expandPaths(config.testPaths);

        paths.unshift(publicPath('runner.js'));      
        paths.unshift(publicPath('ajax.js'));
        paths.unshift(publicPath('json2.js'));
      
        for (var i=0,l=paths.length; i<l; i++) {
          scripts += '<script type="text/javascript" src="/files?path=' + encodeURIComponent(paths[i]) + '"></script>' + "\n"
        }
      
        var page = data.replace('</head>', scripts + '</head>');
        response.send(page)
      });
    });
    
    app.post('/result', function(request, response) {
      var browser = {
        userAgent: request.header('User-Agent'),
        name: getBrowserName(request)
      };
      config.process(browser, request.body.data);
      response.send(200);
    });
    
    app.get('/tick', function(request, response) {
      var paths = expandPaths(config.testPaths);
      var browser = getBrowserState(request);
      var now = new Date().getTime();
      
      function checkModTime(index) {
        fs.stat(path.join(config.root, paths[index]), function(error, stats) {
          if (!stats) {
            debug('failed to get stats for ' + paths[index]);
            return;
          }
          if (typeof(browser.lastSeenAt) == 'undefined' || browser.lastSeenAt < stats.mtime.getTime()) {
            browser.lastSeenAt = now;
            response.send({reload: true});
          } else {
            var nextIndex = index + 1;
            if (nextIndex < paths.length) {
              checkModTime(nextIndex);
            } else {
              response.send({reload: false});
            }
          }
        });
      }
      checkModTime(0);
    });
    
    app.get('/files', function(request, response) {
      debug("Serving file: " + request.param('path'));
      response.sendfile(path.join(config.root, request.param('path')));
    });
    
    app.get('/static/:file', function(request, response) {
      response.sendfile(publicPath(request.params.file));
    });

    if (app) {
      app.listen(config['port']);
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

  function getBrowserName(req) {
    var ua = req.header('User-Agent');
      
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
  }

  function getBrowserState(req) {
    var ua = req.header('User-Agent');
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
  
};