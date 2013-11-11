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

Una.prototype.enableScreenless = function() {
    var newState = function(room_id, io) {
        var state = null;
        var una_header = {id: 'server', type: 'server', room: room_id};
        var screen_key = 'screen-' + room_id;
        var controller_key = 'controller-' + room_id;

        var getState = function() {
            if (state == null) {
                state = this.initState();
            }
            return state;
        }

        var setState = function(new_state) {
            state = new_state;
        }

        var sendToScreens = function(payload) {
            io.sockets.in(screen_key).emit('server-to-screen', {una: una_header, payload: payload});
        }

        var sendToControllers = function(payload) {
            io.sockets.in(controller_key).emit('server-to-controller', {una: una_header, payload: payload});
        }

        return {getState: getState,
                setState: setState,
                sendToScreens: sendToScreens,
                sendToControllers: sendToControllers,
                initState: this.initState,
                onScreenInput: this.onScreenInput,
                onControllerInput: this.onControllerInput};
    };

    this.screenless = {newState: newState};
}

Una.prototype.listen = function(server) {
    if (typeof server == 'number' || server == null) {
        this.server = http.createServer(this.app).listen(server);
    }
    else {
        this.server = server;
    }
    this.io = io.listen(this.server);
    sockets(this.io, this.screenless).register();
    return this;
}

Una.prototype.registerRoutes = function() {
    this.app.get('/una_js/una.js', function(req, res) {
        var filename = __dirname + '/../client/una.js';
        res.sendfile(path.resolve(filename));
    });
}

module.exports = Una();
