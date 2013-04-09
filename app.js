var bot = require("./bot"),
    http = require('http');

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Thrizzlebot is running in #npnd\n');
}).listen(1337, '127.0.0.1');