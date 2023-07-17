import { WebSocketServer } from 'ws';
// import https from 'https';
import app from './main.js';
import { getRooms, addRoom, removeRoom } from './rooms.js';
// import serverConfig from './config.js';

// const server = https.createServer(serverConfig);

// const socket = new WebSocketServer({ server: server });
const socket = new WebSocketServer({ port: 8080 });

function sendTo(connection, msg) {
  connection.send(JSON.stringify(msg));
}

// server.on('request', app);

socket.on('connection', (ws) => {
  console.log('User connected');

  ws.on('error', console.error);

  ws.on('message', (msg) => {
    let data;

    try {
      data = JSON.parse(msg);
    } catch (e) {
      console.log("Invalid JSON");
      data = {};
    }

    const rooms = getRooms();
    switch (data.type) {
      case 'join':
        console.log(`User joined room "${data.roomId}"`);
        if (rooms[data.roomId]) {
          // already a user in this room, send stored offer
          console.log(`Sending offer to guest of room "${data.roomId}"`);
          sendTo(ws, {
            type: 'offer',
            offer: rooms[data.roomId].offer,
          });
          for (const candidate of rooms[data.roomId].candidates) {
            sendTo(ws, { type: 'candidate', candidate });
          }
          rooms[data.roomId].guest = ws;
        } else {
          // create a new room
          console.log('User is host')
          addRoom(data.roomId, ws);
          sendTo(ws, { type: 'create', success: true });
          ws.roomName = data.roomId;
        }
        break;
      case 'offer':
        console.log(`Saving offer for room "${data.roomId}"`);
        rooms[data.roomId].offer = data.offer;
        break;
      case 'answer':
        console.log(`Sending answer to host of room "${data.roomId}"`);
        sendTo(rooms[data.roomId], { type: 'answer', answer: data.answer });
        break;
      case 'hostCandidate':
        console.log(`Saving candidates for room "${data.roomId}"`);
        if (rooms[data.roomId].candidates) {
          rooms[data.roomId].candidates.push(data.candidate);
        } else {
          rooms[data.roomId].candidates = [];
          rooms[data.roomId].candidates.push(data.candidate);
        }
        break;
      case 'guestCandidate':
        console.log('Sending candidates to host');
        sendTo(rooms[data.roomId], { type: 'candidate', candidate: data.candidate });
        break;
      case 'leave':
        console.log(`Disconnecting from room "${data.roomId}"`);
        const roomHost = rooms[data.roomId];
        if (roomHost) {
          sendTo(roomHost, { type: 'leave' });
        }
        break;
      case 'status':
        console.log('Got a status message ^');
        break;
      default:
        console.log(data.type)
        console.log('idk what to do!')
        sendTo(ws, { type: 'error', message: `Command not found: "${data.type}"` });
        break;
    }
  });
  
  ws.on('close', () => {
    if (ws.roomName) {
      const rooms = getRooms();
      // we're the host, alert guest and delete the room
      if (rooms[ws.roomName].guest) {
        sendTo(rooms[ws.roomName].guest, {type: 'leave'});
        console.log('Sent leave message to guest');
      }
      removeRoom(ws.roomName);
    }
  });

  ws.send(JSON.stringify({ msg: 'connected' }));
});

// server.listen(5000);
app.listen(5000);
console.log('Server started on port 5000');
