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
    
    console.log(data);

    let user;
    switch (data.type) {
      case 'join':
        console.log(`User joined room "${data.name}"`);
        if (rooms[data.name]) {
          // already a user in this room, send stored offer
          console.log(`Sending offer to guest of room "${data.name}"`);
          sendTo(ws, {
            type: 'offer',
            offer: rooms[data.name].offer,
            host: rooms[data.name].host,
          });
          for (const candidate of rooms[data.name].candidates) {
            sendTo(ws, { type: 'candidate', candidate });
          }
        } else {
          // create a new room
          console.log('User is host')
          rooms[data.name] = ws;
          sendTo(ws, { type: 'create', success: true });
        }
        break;
      case 'offer':
        console.log(`Saving offer for room "${data.name}"`);
        rooms[data.name].offer = data.offer;
        break;
      case 'answer':
        console.log(`Sending answer to host of room "${data.name}"`);
        ws.guest = data.name;
        sendTo(rooms[data.name], { type: 'answer', answer: data.answer, name: ws.name });
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
        console.log(`Disconnecting from user "${data.name}"`);
        user = rooms[data.name];
        if (user) {
          sendTo(user, { type: 'leave' });
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
    if (ws.name) {
      delete rooms[ws.name];

      if (ws.remoteName) {
        console.log(`Disconnecting from user "${ws.remoteName}"`);
        const user = rooms[data.remoteName];
        if (user) {
          sendTo(user, { type: 'leave' });
        }
      }
    }
  });

  ws.send(JSON.stringify({ msg: 'connected' }));
});

server.listen(5000);
console.log('Server started on port 5000');
