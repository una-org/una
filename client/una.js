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
    var registered = false;

    var screen_callbacks = {};
    var server_callbacks = {};

    var register = function(room_id, user_data, callback) {
        if (registered) {
            return;
        }
        registered = true;

        socket.emit('register-controller', {room: room_id, user_data: user_data});

        socket.on('controller-ready', function(data) {
            if (callback) {
                callback(data);
            }

        });

        socket.on('screen-to-controller', function(data) {
            if (data.key in screen_callbacks) {
                for (var i=0;i<screen_callbacks[data.key].length;i++) {
                    screen_callbacks[data.key][i](data);
                }
            }
        });

        socket.on('server-to-controller', function(data) {
            if (data.key in server_callbacks) {
                for (var i=0;i<server_callbacks[data.key].length;i++) {
                    server_callbacks[data.key][i](data);
                }
            }
        });
    }

    var onScreenInput = function(key, callback) {
        if (key in screen_callbacks) {
            screen_callbacks[key].push(callback);
        }
        else {
            screen_callbacks[key] = [callback];
        }
    }

    var sendToScreen = function(key, user_data) {
        socket.emit('controller-to-screen', key, user_data);
    }

    var onServerInput = function(key, callback) {
        if (key in server_callbacks) {
            server_callbacks[key].push(callback);
        }
        else {
            server_callbacks[key] = [callback];
        }
    }

    var sendToServer = function(key, user_data) {
        socket.emit('controller-to-server', key, user_data);
    }


    return {register: register, 
            sendToScreen: sendToScreen,
            onScreenInput: onScreenInput,
            sendToServer: sendToServer,
            onServerInput: onServerInput};
})();

var UnaScreen = (function() {
    var controllerList = [];
    var join_callback = function() {return true;}
    var leave_callback = function() {}
    var controller_callbacks = {};
    var server_callbacks = {};

    var registered = false;
    var register = function(room_id, user_data, callback) {
        if (registered) {
            return;
        }

        registered = true;
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

        socket.on('controller-to-screen', function(data) {
            if (data.key in controller_callbacks) {
                for (var i=0;i<controller_callbacks[data.key].length;i++) {
                    controller_callbacks[data.key][i](data);
                }
            }
        });

        socket.on('server-to-screen', function(data) {
            if (data.key in server_callbacks) {
                for (var i=0;i<server_callbacks[data.key].length;i++) {
                    server_callbacks[data.key][i](data);
                }
            }
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

    var onControllerInput = function(key, callback) {
        if (key in controller_callbacks) {
            controller_callbacks[key].push(callback);
        }
        else {
            controller_callbacks[key] = [callback];
        }
    }

    var sendToController = function(controller_id, key, user_data) {
        // Check if the controller we are sending to exists
        if (controllerList.indexOf(controller_id) > -1) {
            socket.emit('screen-to-controller', controller_id, key, user_data);
        }
    }

    var onServerInput = function(key, callback) {
        if (key in server_callbacks) {
            server_callbacks[key].push(callback);
        }
        else {
            server_callbacks[key] = [callback];
        }
    }

    var sendToServer = function(key, user_data) {
        socket.emit('screen-to-server', key, user_data);
    }

    return {register: register, 
        onControllerJoin: onControllerJoin, 
        onControllerLeave: onControllerLeave, 
        onControllerInput: onControllerInput,
        sendToController: sendToController,
        sendToServer: sendToServer,
        onServerInput: onServerInput,
        controllerIds: function() {return controllerList}};
})();