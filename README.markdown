Diligence
=========

A proof of concept remote JavaScript console, like [JsTestDriver](http://code.google.com/p/js-test-driver/).

## Prerequisites

You need to have [Node](http://tinyclouds.org/node/) installed.

## Running the server

    node diligence.js
    
Then point a browser to localhost:5678. I've only used Firefox so far.

Look for 'All tests passed' in your console. Now go add a typo or something to tests.js. You should now see 'There was a failure'.

## What is going on here

When a browser first makes a request, it is sent an HTML file with a little JavaScript code. Every second, the browser will then make a request to check for code to be run. If there is code, it is eval'ed and the response is sent as a request back to the server.

## TODO
* Design a JSON format to use to send code and results back and forth
* Sandbox client-side eval
* Add logging