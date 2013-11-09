var express = require('express');
var una = require('..');
var should = require('should');
var http = require('http');

describe('una', function() {
    describe('running of server', function() {
        it('should run server', function(done) {
            var una_app = una();
            var app = una_app.app;
            app.set('port', process.env.PORT || 3216);

            una_app.listen(http.createServer, app.get('port'), function() {
                done();
            });
        });
    });
});