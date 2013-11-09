// Una JS Client
var socket = io.connect('');

socket.on('server-message', function(data) {
    console.log('Server> ' + data.message);
});

// Performance calls for use in rttHeartBeat
window.performance = window.performance || {};
performance.now = (function() {
    return performance.now       ||
        performance.mozNow    ||
        performance.msNow     ||
        performance.oNow      ||
        performance.webkitNow ||
        Date.now; 
})();

// For testing RTT in every 2 seconds - avg over 5 pings
// There is exactly a 2 second window to send the pings
// If we don't see 5 return pings in 2 sec == disconnected
var INTERVAL_HEART_BEAT = 2000;
function rttHeartBeat() {
  var timings = [];
  var hb_start = performance.now();

  socket.on('server-rttHeartBeat', function(hb) {
    var time = performance.now();
    hb.client_end_time = time;
    var diff = hb.client_end_time - hb.client_start_time;
    timings.push(diff);

    // Currently does not take into account timeouts
    if (timings.length === 5) {
      var total = timings.reduce(function(a,b){return a+b;});
      // document.getElementById('ping').innerHTML = 'Latency : ' + (total/5.0) + ' ms';
    }
  });

  for (var i = 0; i < 5; i ++) {
    var time = performance.now();
    socket.emit('arena-rttHeartBeat', {client_start_time: time});
  }

  setTimeout(function() {
    if (timings.length < 5) {
      document.getElementById('ping').innerHTML = 'Reconnecting ... (Latency > '+INTERVAL_HEART_BEAT+' ms)';
    }
  }, INTERVAL_HEART_BEAT)
}

setInterval(rttHeartBeat, INTERVAL_HEART_BEAT);


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

        socket.on('screen_ready', function(data) {
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
