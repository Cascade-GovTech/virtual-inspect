import { WebSocketServer } from 'ws';
import https from 'https';
import app from './main.js';
import serverConfig from './config.js';

console.log(serverConfig);

const rooms = {};

const server = https.createServer(serverConfig);

const socket = new WebSocketServer({ server: server });

function sendTo(connection, msg) {
  connection.send(JSON.stringify(msg));
}

server.on('request', app);

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

    switch (data.type) {
      case 'join':
        console.log(`User joined room "${data.name}"`);
        if (rooms[data.name]) {
          // already a user in this room, send stored offer
          console.log(`Sending offer to guest of room "${data.name}"`);
          sendTo(ws, {
            type: 'offer',
            offer: rooms[data.name].offer,
          });
          for (const candidate of rooms[data.name].candidates) {
            sendTo(ws, { type: 'candidate', candidate });
          }
          rooms[data.name].guest = ws;
        } else {
          // create a new room
          console.log('User is host')
          rooms[data.name] = ws;
          sendTo(ws, { type: 'create', success: true });
          ws.roomName = data.name;
        }
        break;
      case 'offer':
        console.log(`Saving offer for room "${data.name}"`);
        rooms[data.name].offer = data.offer;
        break;
      case 'answer':
        console.log(`Sending answer to host of room "${data.name}"`);
        sendTo(rooms[data.name], { type: 'answer', answer: data.answer });
        break;
      case 'hostCandidate':
        console.log(`Saving candidates for room "${data.name}"`);
        if (rooms[data.name].candidates) {
          rooms[data.name].candidates.push(data.candidate);
        } else {
          rooms[data.name].candidates = [];
          rooms[data.name].candidates.push(data.candidate);
        }
        break;
      case 'guestCandidate':
        console.log('Sending candidates to host');
        sendTo(rooms[data.name], { type: 'candidate', candidate: data.candidate });
        break;
      case 'leave':
        console.log(`Disconnecting from room "${data.name}"`);
        const roomHost = rooms[data.name];
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
      // we're the host, alert guest and delete the room
      if (rooms[ws.roomName].guest) {
        sendTo(rooms[ws.roomName], {type: 'leave'});
        console.log('Sent leave message to guest');
      }
      delete rooms[ws.roomName];
    }
  });

  ws.send(JSON.stringify({ msg: 'connected' }));
});

server.listen(5000);
console.log('Server started on port 5000');
