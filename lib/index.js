var express = require('express');
var io = require('socket.io');
var sockets = require('./sockets.js');

function Una() {
    if (!(this instanceof Una)) return new Una();
    this.app = express();

    this.registerRoutes();
}

Una.prototype.listen = function(server) {
    this.server = server;
    this.io = io.listen(server);
    sockets(this.io).register();
}

Una.prototype.registerRoutes = function() {
    this.app.get('/una_js/una.js', function(req, res) {
        res.sendfile('./client/una.js');
    });
}

module.exports = Una;
