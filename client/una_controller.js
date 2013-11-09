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