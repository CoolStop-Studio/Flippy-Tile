let
    fs = require('fs'),
    path = require('path'),
    http = require('http');

const cache = {};

/**
* lookup content type
* infer from the extension
* no extension would resolve in "text/plain"
*/
function lookupContentType(fileName) {
const ext = fileName.toLowerCase().split('.').slice(1).pop();
switch (ext) {
case 'txt':
  return 'text/plain';
case 'js':
  return 'text/javascript'
case 'css':
  return 'text/css'
case 'pdf':
  return 'application/pdf';
case 'jpg':
case 'jpeg':
  return 'image/jpeg';
case 'mp4':
  return 'video/mp4';
default:
  return ''
}
}


/**
* plain 404 response
*/
function send404(res){
res.writeHead(404, {'Content-Type':'text/plain'});
res.write('Error 404: resource not found.');
res.end();
}

/**
* sending file response
*/
function sendFile(res, filePath, fileContents){
res.writeHead(200, {"Content-Type": lookupContentType(path.basename(filePath))});
res.end(fileContents);
}

/**
* serve static content
* using cache if possible
*/
function serveStatic(res, cache, absPath) {
// use cache if there is any
if (cache[absPath]) {
    sendFile(res, absPath, cache[absPath]);
} else {
    fs.exists(absPath, function(fileExists) {
  // attempt to read the resource only if it exist
        if (fileExists) {
            fs.readFile(absPath, function(err, data){
      // not able to read the resource
                if(err) {
                    send404(res);
                } else {
                    cache[absPath] = data;
                    sendFile(res, absPath, data);
                }
            });
        } else {
    // resource does not exist
            send404(res);
        }
    });
}
}

module.exports = function startServer(spec){
let { path, port } = spec;

// create server object
var server = http.createServer(function(req, res){
// if no resource is specified use index.html
    if(req.url === '/') {
        const filePath = path + 'index.html';
        console.log("serving: " + filePath)
        serveStatic(res, cache, filePath);
    } else {
        const filePath = path + req.url;
        serveStatic(res, cache, filePath);
    }
});

server.listen(port, function(){
console.log("server listening on port: "+port);
});
return server;
};

const startServer = require('./server.js')

startServer({ path: './public/', port: 3000 });