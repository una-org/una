// Una JS Client
var socket = io.connect('');

socket.on('server-message', function(data) {
    console.log('Server> ' + data.message);
});

var UnaController = (function() {
    var register = function(room_id, user_data, callback) {
        socket.emit('register-controller', {room: room_id, user_data: user_data});

        socket.on('controller-ready', function(data) {
            callback(data);
        });
    }

    var sendInput = function(user_data) {
        socket.emit('controller-input', user_data);
    }

    return {register: register, 
            sendInput: sendInput};
})();

var UnaScreen = (function() {
    var register = function(room_id, user_data, callback) {
        socket.emit('register-screen', {room: room_id, user_data: user_data});

        socket.on('screen-ready', function(data) {
            callback(data);
        });
    }

    var onControllerJoin = function(callback) {
        socket.on('controller-join', function(data) {
            var success = callback(data);
            socket.emit('acknowledge-controller', {controller_id: data.una.id, success: success});
        });
    }

    var onControllerLeave = function(callback) {
        socket.on('controller-leave', function(data) {
            callback(data);
        });
    }

    var onControllerInput = function(callback) {
        socket.on('controller-input', function(data) {
            callback(data);
        });
    }

    return {register: register, 
        onControllerJoin: onControllerJoin, 
        onControllerLeave: onControllerLeave, 
        onControllerInput: onControllerInput};
})();
