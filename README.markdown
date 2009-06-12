Diligence
#########

A proof of concept remote JavaScript console, like JsTestDriver(http://code.google.com/p/js-test-driver/).

## Prerequisites

You need to have [Node](http://tinyclouds.org/node/) installed.

## Running the server

    node server.js
    
Then point your browsers to localhost:5678.

## What is going on here

When a browser first makes a request, it is sent an HTML file with a little JavaScript code. Every second, the browser will then make a request to check for code to be run. If there is code, it is eval'ed and the response is sent as a request back to the server.

## TODO
* Design a JSON format to use to send code and results back and forth
* Sandbox client-side eval
* Add logging