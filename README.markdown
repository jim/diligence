Diligence
=========

A proof of concept automated JavaScript test runner, like [JsTestDriver](http://code.google.com/p/js-test-driver/). Only smaller and more hackable.

## Prerequisites

You need to have [Node](http://tinyclouds.org/node/) installed.

## How To Use Diligence

* Create a new test suite file. It should look something like this:

    include('../diligence.js');

    function onLoad() {    
      new diligence.Server(function(setup) {
        setup.publicPath = '../public';
        setup.testPaths ='tests/tests.js';
        setup.collectPath ='tests/collect.js',
        setup.process = function(req, results) {
          puts('* You can customize the process function in your setup block to handle test results');
          for(var key in results) {
            puts(key + ': ' + results[key]);
          }
        };
      });
    }

* Enter paths to your files as setup.testPaths (path globbing coming next)
* Modify the function in tests/collect.js to return an object structure that contains the results of your tests. Use whatever structure you want, but keep in mind it will be transferred to the server encoded in JSON (so you can only send data).
* Modify setup.process to handle your returned data as you see fit.

## Configuration options

The following options can be set inside a setup block:

### publicPath

A string. The path to the public directory, relative to the suite file. Defaults to 'public/' (will work when <code>diligence.js</code> and the public directory are in the same directory).

### testPaths

A string or an array of strings. The path to one or more files to be sent to the client. File globbing coming soon.

### collectPath

A string. The path to <code>collect.js</code>, where the data collection code if defined. This code should return an object structure that can be converted to JSON using <code>JSON.stringify</code>.

### process

A callback function that recieves the decoded JSON data from the client. It is up to this function to write to the console, log files, etc.

### port

An integer. This is the port the diligence server will run on. Default is 5678.

### debug

Boolean. Whether to show noisy debug information.

## Running the server

    node test_suite.js
    
Where 'test_suite.js' is the name of your configuration file. Then point a browser to localhost:5678. I've only used Firefox and Safari so far.

## What is going on here

When a browser first makes a request, it is sent an HTML file with a little JavaScript code. Every second, the browser will then make a request to check for code to be run. If there is code, it is run and the response is sent as a request back to the server.

The sever only looks at the modified time on files in config.testPaths, so changing the configuration file or collect.js will require a server restart.

## TODO
* Sandbox client-side eval
* Add logging

## Inspiration

[JsTestDriver](http://code.google.com/p/js-test-driver/)