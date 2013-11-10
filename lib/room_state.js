function RoomStates() {
    if (!(this instanceof RoomStates)) return new RoomStates();
    this.rooms = {};
}

RoomStates.prototype.addRoom = function(room_id) {
    if (!(room_id in this.rooms)) {
        this.rooms[room_id] = {};
    }
}

RoomStates.prototype.roomExist = function(room_id) {
    return room_id in this.rooms;
}

RoomStates.prototype.addData = function(room_id, key, value) {
    if (!this.roomExist(room_id)) {
        this.addRoom(room_id);
    }

    this.rooms[room_id][key] = value;
}

RoomStates.prototype.getData = function(room_id, key) {
    if (!this.roomExist(room_id)) {
        return null;
    }

    return this.rooms[room_id][key];
}

module.exports = RoomStates();