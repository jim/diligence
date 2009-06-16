Diligence
=========

A proof of concept automated JavaScript test runner, like [JsTestDriver](http://code.google.com/p/js-test-driver/). Only smaller and more hackable.

## Prerequisites

You need to have [Node](http://tinyclouds.org/node/) installed.

## How To Use Diligence

* Create a new test suite file, using test_suite.js as a template.
* Enter paths to your files as setup.testPaths (path globbing coming next)
* Modify the function in tests/collect.js to return an object structure that contains the results of your tests. Use whatever structure you want, but keep in mind it will be transferred to the server encoded in JSON (so you can only send data).
* Modify setup.process to handle your returned data as you see fit.

## Running the server

    node test_suite.js
    
Then point a browser to localhost:5678. I've only used Firefox and Safari so far.

## What is going on here

When a browser first makes a request, it is sent an HTML file with a little JavaScript code. Every second, the browser will then make a request to check for code to be run. If there is code, it is run and the response is sent as a request back to the server.

The sever only looks at the modified time on tests/tests.js, so changing tests/process.js or tests/collect.js will require a server restart.

## TODO
* Sandbox client-side eval
* Add logging

## Inspiration

[JsTestDriver](http://code.google.com/p/js-test-driver/)