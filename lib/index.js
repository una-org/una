var express = require('express');
var io = require('socket.io');

function Una() {
    if (!(this instanceof Una)) return new Una();

    this.app = express();
}

Una.prototype.listen = function(httpConstructor, port, callback) {
    var server = httpConstructor(this.app);
    this.io = io.listen(server);
    this.server = server.listen(port, callback);
}

module.exports = Una;
