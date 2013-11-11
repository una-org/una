function Sockets(io, screenless) {
    if (!(this instanceof Sockets)) return new Sockets(io, screenless);
    this.io = io;
    this.screenless = screenless;
    this.MAX_USERS = {'screen': 1, 'controller': 100};

    if (screenless) {
        this.MAX_USERS['screen'] = 100;
    }

    this.states = {};
}

Sockets.prototype.register = function() {
    var this_ref = this;
    var io = this.io;
    io.sockets.on('connection', function(socket) {
        // Add custom payload to our socket
        socket.una = {room: 'lobby', type: 'unknown', user_data: null};

        // All sockets will join the world room
        socket.join('world');
        this_ref.sendMessage(socket, "MOTD: Hello, World");

        socket.on('register-screen', function(data) {
            // Only register each client once
            if (socket.una.type == 'unknown') {
                this_ref.registerScreen(socket, data);
            }
        });

        socket.on('register-controller', function(data) {
            console.log("registering controller");
            // Only register each client once
            if (socket.una.type == 'unknown') {
                this_ref.registerController(socket, data);
            }
        });
    });
}

Sockets.prototype.sendMessage = function(socket, message) {
    socket.emit('server-message', {message: message});
}

Sockets.prototype.registerClient = function(socket, type, data) {
    var io = this.io;
    var room = data.room;
    var type_room = type + '-' + data.room;
    var type_ready = type + '-ready';
    var this_ref = this;

    socket.una.id = socket.id;
    socket.una.type = type;
    socket.una.room = data.room;
    socket.una.user_data = data.user_data;

    // Check if number of client have exceeded the maximum
    // amount allowed for that type
    if (io.sockets.clients(type_room).length >= this.MAX_USERS[type]) {
        socket.emit(type_ready, {success: false, error: 'Room Full'});
        socket.disconnect();
        return false;
    }

    // Join the correct world
    socket.join('world-' + type);
    socket.join(type_room);

    socket.on('disconnect', function() {
        var una_data = socket.una;
        var type_room = una_data.type + '-' + una_data.room;

        socket.leave(type_room)
        socket.leave('world-' + una_data.type);
    });

    return true;
}

Sockets.prototype.registerScreen = function(socket, data) {
    var io = this.io;
    var screenless = this.screenless;
    var states = this.states;
    if (this.registerClient(socket, 'screen', data)) {
        var res = {success: true};

        // If screenless mode is on, create a new game state
        // for the room
        if (screenless) {
            if (!(data.room in states)) {
                states[data.room] = screenless.newState(data.room, io);
            }
            res.state = states[data.room].getState();
        }

        socket.emit('screen-ready', res);

        // Screen will emit RTT, to be handled by the server
        socket.on('screen-rttHeartBeat', function(data) {
            data.server_time = Date.now();
            socket.emit('server-rttHeartBeat', data);
        });

        // When the screen acknowledge the controller, we sends the ready
        // signal to the controller
        socket.on('acknowledge-controller', function(data) {
            io.sockets.socket(data.controller_id).emit('controller-ready', {success: data.success});
            if (!data.success) {
                socket.disconnect();
            }
        });

        socket.on('screen-to-controller', function(controller_id, payload) {
            io.sockets.socket(controller_id).emit('screen-to-controller', {una: socket.una, payload: payload});
        });

        socket.on('screen-to-server', function(payload) {
            if (screenless && screenless.onScreenInput) {
                screenless.onScreenInput(states[socket.una.room], socket.una, payload);
            }
        });
    }
}

Sockets.prototype.registerController = function(socket, data) {
    var io = this.io;
    var screenless = this.screenless;
    var states = this.states;

    if (this.registerClient(socket, 'controller', data)) {
        // Acknowledge the client in screenless mode
        if (screenless) {
            var res = {'success': true};
            if (!(data.room in states)) {
                states[data.room] = screenless.newState(data.room, io);
            }
            res.state = states[data.room].getState();
            socket.emit('controller-ready', res);
        }

        // In the screen mode, we need to notify the screen that the controller
        // have joined
        else {
            // Notify the screen that the controller have joined
            var screen_identifier = 'screen-' + data.room;
            io.sockets.in(screen_identifier).emit('controller-join', {una: socket.una});
        }

        socket.on('controller-to-screen', function(payload) {
            var una_data = socket.una;
            var screen_identifier = 'screen-' + una_data.room;

            socket.broadcast.to(screen_identifier).emit('controller-to-screen', {una: socket.una, payload: payload});
        });

        socket.on('controller-to-server', function(payload) {
            if (screenless && screenless.onControllerInput) {
                screenless.onControllerInput(states[socket.una.room], socket.una, payload);
            }
        })

        // When controller disconnect, we need to inform the screen
        socket.on('disconnect', function() {
            var una_data = socket.una;
            var screen_identifier = 'screen-' + una_data.room;
            io.sockets.in(screen_identifier).emit('controller-leave', {una: socket.una});
        });

    }
}


module.exports = Sockets;