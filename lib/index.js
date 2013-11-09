var express = require('express');
var io = require('socket.io');
var sockets = require('./sockets.js');

function Una() {
    if (!(this instanceof Una)) return new Una();

    this.app = express();
}

Una.prototype.listen = function(server) {
    this.server = server;
    this.io = io.listen(server);
    sockets(this.io).register();
}

module.exports = Una;
