var express = require('express');
var una_js = require('..');
var should = require('should');
var http = require('http');
var request = require('supertest');
var ioc = require('socket.io-client');

var start_una = function() {
    var una = una_js();
    var server = http.createServer().listen(3000);
    una.listen(server);
    return server;
}

var new_socket = function() {
    return ioc.connect('http://localhost:3000', {'force new connection': true});
}

var server = start_una();

describe('una', function() {
    describe('running of server', function() {
        var socket;

        beforeEach(function(done) {
            socket = new_socket();
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
            socket = new_socket();
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
                    var s2 = new_socket();
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
    })

    describe('controller', function() {
        var socket;
        var room_data = {room: '123'};

        beforeEach(function(done) {
            socket = new_socket();
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
            controller = new_socket();
            payload = {name: 'controller1'};

            controller.emit('register-controller', {room: room_data.room, payload: payload});
            socket.on('controller-join', function(data) {
                if (data.payload.name == 'controller1')
                    done();
            });
        });

        it('s should be able to join a screen', function(done) {
            c1 = new_socket();
            c1_payload = {name: 'controller1'};
            c2 = new_socket();
            c2_payload = {name: 'controller2'};

            var total_count = 0;

            c1.emit('register-controller', {room: room_data.room, payload: c1_payload});
            c2.emit('register-controller', {room: room_data.room, payload: c2_payload});
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
            socket = new_socket();
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
            c1 = new_socket();
            c1_payload = {name: 'controller1'};
            c2 = new_socket();
            c2_payload = {name: 'controller2'};
            c1.emit('register-controller', {room: room_data.room, payload: c1_payload});
            c2.emit('register-controller', {room: room_data.room, payload: c2_payload});

            socket.on('controller-leave', function(data) {
                if (data.payload.name == 'controller1') {
                    done();
                }
            });

            c1.on('controller-ready', function(data) {
                if (data.success)
                    c1.disconnect();
            });
        });
    });
});