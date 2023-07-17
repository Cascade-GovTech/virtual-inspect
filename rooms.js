const rooms = {};

function getRooms() {
    return rooms;
}

function addRoom(id, ws) {
    rooms[id] = ws;
}

function removeRoom(id) {
    rooms[id] = null;
}

export { getRooms, addRoom, removeRoom };
