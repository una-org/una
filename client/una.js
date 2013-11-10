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

    var onScreenInput = function(callback) {
        socket.on('screen-input', function(data) {
            callback(data);
        });
    }

    var sendInput = function(user_data) {
        socket.emit('controller-input', user_data);
    }

    return {register: register, 
            sendInput: sendInput,
            onScreenInput: onScreenInput};
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

    var sendInput = function(controller_id, user_data) {
        // Check if the controller we are sending to exists
        if (controllerList.indexOf(controller_id)) {
            socket.emit('screen-input', controller_id, user_data);
        }
    }

    var controllerList = [];
    onControllerJoin(function(data) {
        controllerList.push(data.una.id);
    });

    onControllerLeave(function(data) {
        var index = controllerList.indexOf(data.una.id);
        controllerList.splice(index, 1);
    })

    return {register: register, 
        onControllerJoin: onControllerJoin, 
        onControllerLeave: onControllerLeave, 
        onControllerInput: onControllerInput,
        sendInput: sendInput,
        controllerIds: function() {return controllerList}};
})();