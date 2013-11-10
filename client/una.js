// Una JS Client
var socket = io.connect('');

socket.on('server-message', function(data) {
    console.log('Server> ' + data.message);
});

// Utils
function randomString(len) {
  return Math.random().toString(36).slice(2,len+2);
}

// Room State
var RoomState = function(socket, room_id) {
    var requests = {};

    // Keep listening for room data events
    socket.on('room-data', function(req_id, key, data) {
        if (req_id in requests) {
            requests[req_id](key, data);
            delete requests[req_id];
        }
    });

    var getData = function(key, callback) {
        var req_id;
        while ((req_id = randomString(8)) in requests);
        requests[req_id] = callback;

        socket.emit('get-room-data', req_id, key);
    };

    var setData = function(key, data) {
        socket.emit('set-room-data', key, data);
    };

    return {setData: setData, getData: getData};
};

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
    var join_callback = function() {return true;}
    var leave_callback = function() {}

    var room_state = null;

    var register = function(room_id, user_data, callback) {
        socket.emit('register-screen', {room: room_id, user_data: user_data});

        socket.on('screen-ready', function(data) {
            if (callback) {
                callback(data);
                room_state = RoomState(socket, room_id);
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

    var setRoomData = function(key, data) {
        room_state.setData(key, data);
    }

    var getRoomData = function(key, callback) {
        room_state.getData(key, callback);
    }

    return {register: register, 
        onControllerJoin: onControllerJoin, 
        onControllerLeave: onControllerLeave, 
        onControllerInput: onControllerInput,
        sendToController: sendToController,
        setRoomData: setRoomData,
        getRoomData: getRoomData,
        controllerIds: function() {return controllerList}};
})();