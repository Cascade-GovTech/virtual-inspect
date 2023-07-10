import { WebSocketServer } from 'ws';
import express from 'express';
import * as url from 'url';

const httpPort = 5000;
const socket = new WebSocketServer({ port: 8080 });
const app = express();

const users = {};

function sendTo(connection, msg) {
  connection.send(JSON.stringify(msg));
}

app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(`${url.fileURLToPath(new URL('.', import.meta.url))}/js`));
app.use(express.static(`${url.fileURLToPath(new URL('.', import.meta.url))}/public`));

console.log();

app.get('/', (req, res) => {
  res.render('index');
});

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
      case 'login':
        console.log(`User "${data.name}" logged`);
        if (users[data.name]) {
          // already a user with this username
          sendTo(ws, { type: 'login', success: false });
        } else {
          // save user to server
          users[data.name] = ws;
          ws.name = data.name;
          sendTo(ws, { type: 'login', success: true });
        }
        break;
      case 'offer':
        console.log(`Sending offer to user "${data.name}"`);
        user = users[data.name];
        if (user) {
          ws.remoteUser = data.name;
          sendTo(user, { type: 'offer', offer: data.offer, name: ws.name });
        }
        break;
      case 'answer':
        console.log(`Sending answer to user "${data.name}"`);
        user = users[data.name];
        if (user) {
          ws.remoteUser = data.name;
          sendTo(user, { type: 'answer', answer: data.answer, name: ws.name });
        }
        break;
      case 'candidate':
        console.log(`Sending candidate to user "${data.name}"`);
        user = users[data.name];
        if (user) {
          sendTo(user, { type: 'candidate', candidate: data.candidate });
        }
        break;
      case 'leave':
        console.log(`Disconnecting from user "${data.name}"`);
        user = users[data.name];
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
      delete users[ws.name];

      if (ws.remoteName) {
        console.log(`Disconnecting from user "${ws.remoteName}"`);
        const user = users[data.remoteName];
        if (user) {
          sendTo(user, { type: 'leave' });
        }
      }
    }
  });

  ws.send(JSON.stringify({ msg: 'connected' }));
});

app.listen(httpPort, () => console.log(`Server started on port ${httpPort}`));
