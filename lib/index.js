var express = require('express');
var io = require('socket.io');
var sockets = require('./sockets.js');
var path = require('path');
var http = require('http');

function Una() {
    if (!(this instanceof Una)) return new Una();
    this.app = express();
    this.express = express;

    this.registerRoutes();
}

Una.prototype.listen = function(server) {
    if (typeof server == 'number') {
        this.server = http.createServer(this.app).listen(server);
    }
    else {
        this.server = server;
    }

    this.io = io.listen(server);
    sockets(this.io).register();
}

Una.prototype.registerRoutes = function() {
    this.app.get('/una_js/una.js', function(req, res) {
        var filename = __dirname + '/../client/una.js';
        res.sendfile(path.resolve(filename));
    });
}

module.exports = Una;
