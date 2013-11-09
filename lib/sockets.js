function Sockets(io) {
    if (!(this instanceof Sockets)) return new Sockets(io);
    this.io = io;
}

Sockets.prototype.register = function() {
    var MAX_USERS = {'screen': 1, 'controller': 100};
    var io = this.io;

    io.sockets.on('connection', function(socket) {
        // Add custom payload to our socket
        socket.una = {room: 'lobby', type: 'unknown', payload: null};

        // All sockets will join the world room
        socket.join('world');
        sendMessage(socket, "MOTD: Hello, World");

        socket.on('register-screen', function(data) {
            registerScreen(socket, data);
        });

        socket.on('register-controller', function(data) {
            registerController(socket, data);

        })
    });

    var sendMessage = function(socket, message) {
        socket.emit('server-message', {message: message});
    }

    var registerClient = function(socket, type, data) {
        var type_room = type + '-' + data.room;
        var type_ready = type + '-ready';

        socket.una.type = type;
        socket.una.room = data.room;
        socket.una.payload = data.payload;

        // Check if number of client have exceeded the maximum
        // amount allowed for that type
        if (io.sockets.clients(type_room).length >= MAX_USERS[type]) {
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

    var registerScreen = function(socket, data) {
        if (registerClient(socket, 'screen', data)) {
            socket.emit('screen-ready', {success: true});

            // Screen will emit RTT, to be handled by the server
            socket.on('screen-rttHeartBeat', function(data) {
                data.server_time = Date.now();
                socket.emit('server-rttHeartBeat', data);
            });

            // When the screen acknowledge the controller, we sends the ready
            // signal to the controller
            socket.on('acknowledge-controller', function(data) {
                io.sockets.socket(data.id).emit('controller-ready', {success: true});
            });
        }
    }

    var registerController = function(socket, data) {
        if (registerClient(socket, 'controller', data)) {
            // Notify the screen that the controller have joined
            var screen_identifier = 'screen-' + data.room;
            io.sockets.in(screen_identifier).emit('controller-join', {id: socket.id, payload: data.payload});

            // When controller disconnect, we need to inform the screen
            socket.on('disconnect', function() {
                var una_data = socket.una;
                var screen_identifier = 'screen-' + una_data.room;
                io.sockets.in(screen_identifier).emit('controller-leave', {id: socket.id, payload: una_data.payload});
            });
        }
    }

}

module.exports = Sockets;