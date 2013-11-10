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

    var sendToScreen = function(user_data) {
        socket.emit('controller-input', user_data);
    }

    return {register: register, 
            sendToScreen: sendToScreen,
            onScreenInput: onScreenInput};
})();

var UnaScreen = (function() {
    var controllerList = [];

    var register = function(room_id, user_data, callback) {
        socket.emit('register-screen', {room: room_id, user_data: user_data});

        socket.on('screen-ready', function(data) {
            callback(data);
        });
    }

    // This method should only be called once
    var onControllerJoin = function(callback) {
        socket.on('controller-join', function(data) {
            controllerList.push(data.una.id);
            var success = callback(data);
            socket.emit('acknowledge-controller', {controller_id: data.una.id, success: success});
        });
    }

    // This method should only be called once
    var onControllerLeave = function(callback) {
        socket.on('controller-leave', function(data) {
            var index = controllerList.indexOf(data.una.id);
            controllerList.splice(index, 1);
            callback(data);
        });
    }

    var onControllerInput = function(callback) {
        socket.on('controller-input', function(data) {
            callback(data);
        });
    }

    var sendToController = function(controller_id, user_data) {
        // Check if the controller we are sending to exists
        if (controllerList.indexOf(controller_id) > -1) {
            socket.emit('screen-input', controller_id, user_data);
        }
    }

    return {register: register, 
        onControllerJoin: onControllerJoin, 
        onControllerLeave: onControllerLeave, 
        onControllerInput: onControllerInput,
        sendToController: sendToController,
        controllerIds: function() {return controllerList}};
})();