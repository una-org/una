// Una JS Client
var socket = io.connect('');

socket.on('server-message', function(data) {
    console.log('Server> ' + data.message);
});

// Utils
function randomString(len) {
  return Math.random().toString(36).slice(2,len+2);
}

var UnaController = (function() {

    var register = function(room_id, user_data, callback) {
        socket.emit('register-controller', {room: room_id, user_data: user_data});

        socket.on('controller-ready', function(data) {
            if (callback) {
                callback(data);
            }
        });
    }

    var onScreenInput = function(callback) {
        socket.on('screen-to-controller', function(data) {
            callback(data);
        });
    }

    var sendToScreen = function(user_data) {
        socket.emit('controller-to-screen', user_data);
    }


    return {register: register, 
            sendToScreen: sendToScreen,
            onScreenInput: onScreenInput};
})();

var UnaScreen = (function() {
    var controllerList = [];
    var join_callback = function() {return true;}
    var leave_callback = function() {}

    var register = function(room_id, user_data, callback) {
        socket.emit('register-screen', {room: room_id, user_data: user_data});

        socket.on('screen-ready', function(data) {
            if (callback) {
                callback(data);
            }
        });

        socket.on('controller-join', function(data) {
            controllerList.push(data.una.id);
            var success = join_callback(data);
            socket.emit('acknowledge-controller', {controller_id: data.una.id, success: success});
        });

        socket.on('controller-leave', function(data) {
            var index = controllerList.indexOf(data.una.id);
            controllerList.splice(index, 1);
            leave_callback(data);
        });
    }

    // This method should only be called once
    var onControllerJoin = function(callback) {
        join_callback = callback;
    }

    // This method should only be called once
    var onControllerLeave = function(callback) {
        leave_callback = callback;
    }

    var onControllerInput = function(callback) {
        socket.on('controller-to-screen', function(data) {
            callback(data);
        });
    }

    var sendToController = function(controller_id, user_data) {
        // Check if the controller we are sending to exists
        if (controllerList.indexOf(controller_id) > -1) {
            socket.emit('screen-to-controller', controller_id, user_data);
        }
    }

    return {register: register, 
        onControllerJoin: onControllerJoin, 
        onControllerLeave: onControllerLeave, 
        onControllerInput: onControllerInput,
        sendToController: sendToController,
        controllerIds: function() {return controllerList}};
})();