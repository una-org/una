var express = require('express');
var una = require('..');
var should = require('should');
var http = require('http');
var request = require('supertest');
var ioc = require('socket.io-client');

var start_una = function() {
    var server = http.createServer(una.app).listen();
    una.listen(server);
    return server;
}

var new_socket = function(server) {
    var address = server.address();
    var url = 'http://' + address.address + ':' + address.port;
    return ioc.connect(url, {'force new connection': true});
}

var screenless_una = function() {
    var una = require('..');
    una.enableScreenless();
    una.screenless.initState = function(UnaServer, una_header, payload) {
        return "game_state";
    };
    return una;
}

var server = start_una();

describe('una', function() {
    describe('static files', function() {
        it('should be able to get una client file', function(done) {
            request(server).get('/una_js/una.js').expect(200, done)
        });
    });

    describe('server', function() {
        it('should be able to listen on port number', function(done) {
            var una = require('..').listen();
            request(una.server).get('/una_js/una.js').expect(200, done);
        });
    })

    describe('running of server', function() {
        var socket;

        beforeEach(function(done) {
            socket = new_socket(server);
            socket.on('connect', function() {
                done();
            })
        });
        afterEach(function(done) {
            if (socket.socket.connected) {
                socket.disconnect();
            }
            done();
        });

        it('should receive MOTD', function(done) {
            socket.on('server-message', function(data) {
                if (data.message.indexOf('MOTD') !== -1) {
                    done();
                }
            });
        });
    });

    describe('screen', function() {
        var socket;

        beforeEach(function(done) {
            socket = new_socket(server);
            socket.on('connect', function() {
                done();
            })
        });
        afterEach(function(done) {
            if (socket.socket.connected) {
                socket.disconnect();
            }
            done();
        });

        it('should be able to register', function(done) {
            socket.emit('register-screen', {room: '123'});
            socket.on('screen-ready', function(data) {
                if (data.success) {
                    done();
                }
            });
        });

        it('should only have one instance per room id', function(done) {
            var room_data = {room: '123'};
            socket.emit('register-screen', room_data);

            socket.on('screen-ready', function(data) {
                if (data.success) {
                    // We now have one screen, we try make another screen
                    // join the same room
                    var s2 = new_socket(server);
                    s2.emit('register-screen', room_data);
                    s2.on('screen-ready', function(data) {
                        if (!data.success) {
                            s2.disconnect();
                            done();
                        }
                    });
                }
            });
        });

        it('should only be able to join the room after the previous screen terminates', function(done) {
            var room_data = {room: '123'};
            socket.emit('register-screen', room_data);

            socket.on('screen-ready', function(data) {
                if (data.success) {
                    socket.disconnect();
                    // Since the screen has been disconnected, new screen should be able to
                    // join the same id
                    var s2 = new_socket(server);
                    s2.emit('register-screen', room_data);
                    s2.on('screen-ready', function(data) {
                        if (data.success) {
                            s2.disconnect();
                            done();
                        }
                    });
                }
            });
        });
    })

    describe('controller', function() {
        var socket;
        var room_data = {room: '123'};

        beforeEach(function(done) {
            socket = new_socket(server);
            socket.on('connect', function() {
                socket.emit('register-screen', room_data);
                done();
            })
        });
        afterEach(function(done) {
            if (socket.socket.connected) {
                socket.disconnect();
            }
            done();
        });

        it('should be able to join a screen', function(done) {
            var controller = new_socket(server);
            var user_data = {name: 'controller1'};

            controller.emit('register-controller', {room: room_data.room, user_data: user_data});
            socket.on('controller-join', function(data) {
                if (data.una.user_data.name == 'controller1')
                    done();
            });
        });

        it('should be ready only after acknowledged by screen', function(done) {
            var controller = new_socket(server);
            var user_data = {name: 'controller1'};
            var ack = false;

            controller.emit('register-controller', {room: room_data.room, user_data: user_data});
            socket.on('controller-join', function(data) {
                ack = true;
                socket.emit('acknowledge-controller', {controller_id: data.una.id, success: true});
            });

            controller.on('controller-ready', function(data) {
                done();
            });
        });

        it('s should be able to join a screen', function(done) {
            c1 = new_socket(server);
            c1_user_data = {name: 'controller1'};
            c2 = new_socket(server);
            c2_user_data = {name: 'controller2'};

            var total_count = 0;

            c1.emit('register-controller', {room: room_data.room, user_data: c1_user_data});
            c2.emit('register-controller', {room: room_data.room, user_data: c2_user_data});
            socket.on('controller-join', function(data) {
                total_count++;
                if (total_count == 2)
                    done();
            });
        });
    });

    describe('screen and controllers', function() {
        var socket;
        var room_data = {room: '123'};

        beforeEach(function(done) {
            socket = new_socket(server);
            socket.on('connect', function() {
                socket.emit('register-screen', room_data);
                done();
            })
        });
        afterEach(function(done) {
            if (socket.socket.connected) {
                socket.disconnect();
            }
            done();
        });

        it('should be informed when a controller leave', function(done) {
            var c1 = new_socket(server);
            var c1_user_data = {name: 'controller1'};
            var c2 = new_socket(server);
            var c2_user_data = {name: 'controller2'};
            c1.emit('register-controller', {room: room_data.room, user_data: c1_user_data});
            c2.emit('register-controller', {room: room_data.room, user_data: c2_user_data});

            socket.on('controller-join', function(data) {
                socket.emit('acknowledge-controller', {controller_id: data.una.id, success: true});
            });


            c1.on('controller-ready', function(data) {
                if (data.success)
                    c1.disconnect();
            });

            socket.on('controller-leave', function(data) {
                if (data.una.user_data.name == 'controller1') {
                    done();
                }
            });
        });

        it('should be able to send input from controller', function(done) {
            var c1 = new_socket(server);
            var c1_user_data = {name: 'controller1'};
            c1.emit('register-controller', {room: room_data.room, user_data: c1_user_data});

            socket.on('controller-join', function(data) {
                socket.emit('acknowledge-controller', {controller_id: data.una.id, success: true});
            });

            c1.on('controller-ready', function(data) {
                c1.emit('controller-to-screen', {shoot: true});
            });

            socket.on('controller-to-screen', function(data) {
                if (data.payload.shoot)
                    done();
            });
        });

        it('should be able to send input from screen', function(done) {
            var c1 = new_socket(server);
            var c1_user_data = {name: 'controller1'};
            c1.emit('register-controller', {room: room_data.room, user_data: c1_user_data});

            var c1_id;
            socket.on('controller-join', function(data) {
                c1_id = data.una.id;
                socket.emit('acknowledge-controller', {controller_id: data.una.id, success: true});
            });

            c1.on('controller-ready', function(data) {
                c1.emit('controller-to-screen', {shoot: true});
            });

            c1.on('screen-to-controller', function(data) {
                if (data.payload.success)
                    done();
            });

            socket.on('controller-to-screen', function(data) {
                socket.emit('screen-to-controller', c1_id, {success: true});
            });
        });
    });

    describe('screenless mode', function() {
        describe('server initialization', function() {
                it('should be possible', function(done) {
                var una_server = screenless_una();
                done();
            });
        });

        describe('game state', function() {
            it('should be able to be set', function(done) {
                var una = screenless_una();
                una.screenless.initState = function() {
                    return "abc";
                }
                una.screenless.onScreenInput = function(UnaServer, una_header, payload) {
                    UnaServer.setState(payload);
                    UnaServer.sendToScreens(UnaServer.getState());
                }
                una.listen();

                var scn = new_socket(una.server);
                scn.emit('register-screen', {room: '123'});
                scn.on('screen-ready', function(res) {
                    if (res.state == "abc") {
                        scn.emit('screen-to-server', 'def');
                    }
                });

                scn.on('server-to-screen', function(res) {
                    if (res.payload == 'def') {
                        done();
                    }
                });
            });

            it('should be tied to the same room', function(done) {
                var una = screenless_una();
                una.screenless.initState = function() {
                    return "abc";
                }
                una.screenless.onScreenInput = function(UnaServer, una_header, payload) {
                    UnaServer.setState(payload);
                    UnaServer.sendToScreens(UnaServer.getState());
                }
                una.listen();

                var scn = new_socket(una.server)
                var scn2 = new_socket(una.server)
                scn.emit('register-screen', {room: '123'});

                var count = 2;
                scn.on('screen-ready', function(res) {
                    if (res.success) {
                        if (res.state == "abc") {
                            scn.emit('screen-to-server', 'hello from screen');
                        }
                    }
                    scn2.emit('register-screen', {room: '111'});
                });

                scn.on('server-to-screen', function(res) {
                    if (res.payload == 'hello from screen') {
                        count--;
                        if (count == 0) done();
                    }
                });

                scn2.on('screen-ready', function(res) {
                    if (res.success) {
                        if (res.state == "abc") {
                            count--;
                            if (count == 0) done();
                        }
                    }
                });
            });
        });

        describe('screen', function() {
            it('should be able to send to server', function(done) {
                var una = screenless_una();
                una.screenless.onScreenInput = function(UnaServer, una_header, payload) {
                    if (payload == 'hello from screen') {
                        done();
                    }
                }
                una.listen();

                var scn = new_socket(una.server)
                scn.emit('register-screen', {room: '123'});
                scn.on('screen-ready', function(res) {
                    if (res.success) {
                        if (res.state == "game_state") {
                            scn.emit('screen-to-server', 'hello from screen');
                        }
                    }
                });
            });
        });
/*
        describe('controller', function() {
            it('should be able to send to server', function(done) {
                var una = screenless_una();
                una.screenless.onControllerInput = function(UnaServer, una_header, payload) {
                    if (payload == 'hello from controller') {
                        done();
                    }
                }
                una.listen();
            });

            var c1 = new_socket(una.server);
            c1.emit('register-controller', {room: '123'});
            c1.on('controller-ready', function(res) {
                if (res.success) {
                    c1.emit('controller-to-server', 'hello from controller');
                }
            });
        });
*/
    });
});