var fs = require('fs');
var url = require('url');
var crypto = require('crypto');
var path = require('path');
var config = require('../config.js');

/*************************************************************

You should implement your request handler function in this file.

requestHandler is already getting passed to http.createServer()
in basic-server.js, but it won't work as is.

You'll have to figure out a way to export this function from
this file and include it in basic-server.js so that it actually works.

*Hint* Check out the node module documentation at http://nodejs.org/api/modules.html.

**************************************************************/
var documentRoot = config.documentRoot;

var requestHandler = function(request, response) {
  // Request and Response come from node's http module.
  //
  // They include information about both the incoming request, such as
  // headers and URL, and about the outgoing response, such as its status
  // and content.
  //
  // Documentation for both request and response can be found in the HTTP section at
  // http://nodejs.org/documentation/api/

  // Do some basic logging.
  //
  // Adding more logging to your server can be an easy way to get passive
  // debugging help, but you should always be careful about leaving stray
  // console.logs in your code.
  console.log('Serving request type ' + request.method + ' for url ' + request.url);
  var pathname = url.parse(request.url).pathname.replace(/\/$/, '');

  /**************************************************
  * Router Refactor
  // check if we have access to the pathname on the fs
  // if we do have access to the pathname on the fs
    // static file handler
  // else
    // if pathname is /classes/messages
      // call appropriate messages method handler
    // if pathname is /classes/rooms
      // call appropriate rooms method handler
    // else
      // 404

  // messages
    // get -> serve messages
    // post -> add a message

  // rooms
    // get -> serve rooms
    // post -> method not supported

  // static file handler
    // if the pathname is a file
      // if method is GET
        // serve the file
      // else
        // method not supported
  // else
      // respond with 403
  // route requests to associated actions
  ******************************************************/

  // old router
  if (pathname === '/classes/messages' || pathname === '/log') {
    if (request.method === 'POST') {
      postHandler(request, response);
    } else {
      getHandler(request, response);
    }
  } else {
    if (pathname === '') { pathname = '/index.html'; }
    
    try {
      fs.accessSync(documentRoot + pathname);
    } catch (e) {
      returnWithStatusCode(response, 404);
      return;
    }

    if (fs.statSync(documentRoot + pathname).isFile()) {
      var file = fs.readFileSync(documentRoot + pathname);

      var contentTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif'
      };
      var headers = defaultCorsHeaders;
      headers['Content-Type'] = contentTypes[path.extname(pathname)];

      // respond with file contents
      response.writeHead(200, headers);
      response.end(file);
    } else {
      returnWithStatusCode(response, 403);
    }
  }
};

var returnWithStatusCode = function(response, statusCode) {
  response.writeHead(statusCode, defaultCorsHeaders);
  response.end();
};

var getHandler = (request, response) => {
  var messages = fs.readFileSync('messages.json', 'utf8') || '[]';

  var headers = defaultCorsHeaders;
  headers['Content-Type'] = 'application/json';

  // .writeHead() writes to the request line and headers of the response,
  // which includes the status and all headers.
  response.writeHead(200, headers);

  // Make sure to always call response.end() - Node may not send
  // anything back to the client until you do. The string you pass to
  // response.end() will be the body of the response - i.e. what shows
  // up in the browser.
  //
  // Calling .end "flushes" the response's internal buffer, forcing
  // node to actually send all the data over to the client.
  response.end(JSON.stringify({
    results: JSON.parse(messages)
  }));
};

var postHandler = (request, response) => {
  var messages = fs.readFileSync('messages.json', 'utf8') || '[]';
  messages = JSON.parse(messages);

  // get body
  var body = [];
  
  request.on('data', function(chunk) {
    body.push(chunk);
  });

  request.on('end', function() {
    body = body.join('');
    body = JSON.parse(body);
    body.objectId = crypto.randomBytes(16).toString('hex');

    messages.push(body);
    messages = JSON.stringify(messages);

    fs.writeFileSync('messages.json', messages, 'utf8');
    response.writeHead(201, defaultCorsHeaders);
    response.end(JSON.stringify({success: true}));
  });
};

// These headers will allow Cross-Origin Resource Sharing (CORS).
// This code allows this server to talk to websites that
// are on different domains, for instance, your chat client.
//
// Your chat client is running from a url like file://your/chat/client/index.html,
// which is considered a different domain.
//
// Another way to get around this restriction is to serve you chat
// client from this domain by setting up static file serving.
var defaultCorsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'access-control-allow-headers': 'content-type, accept',
  'access-control-max-age': 10 // Seconds.
};

exports.requestHandler = requestHandler;
