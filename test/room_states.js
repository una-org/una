var states = require('../lib/room_states');
var should = require('should');

describe('room states', function() {
    it('should be able to create new rooms', function(done) {
        var count = 0;
        states.addRoom('room_id');
        if (states.roomExist('room_id'))
            count++;
        if (!states.roomExist('room_id2'))
            count++;
        if (count == 2)
            done();
    });
    it('should allow people to add and get room data', function(done) {
        states.addData('room_id', 'key', 'value');
        if (states.getData('room_id', 'key') == 'value') {
            done();
        }
    });
});