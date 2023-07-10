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

    switch (data.type) {
      case 'login':
        console.log(`User "${data.name}" logged in`);
        break;
      case 'offer':
        console.log(`Sending offer to user "${data.name}"`);
        break;
      case 'answer':
        console.log(`Sending answer to user "${data.name}"`);
        break;
      case 'candidate':
        console.log(`Sending candidate to user "${data.name}"`);
        break;
      case 'leave':
        console.log(`Disconnecting from user "${data.name}"`);
        break;
      default:
        sendTo(ws, { type: 'error', message: `Command not found: "${data.type}"` });
        break;
    }
  });
  
  ws.on('close', () => {
    if (ws.name) {
      delete users[ws.name];

      if (ws.remoteName) {
        console.log(`Disconnecting from user "${ws.remoteName}"`);
        
      }
    }
  });

  ws.send('connected');
});

app.listen(httpPort, () => console.log(`Server started on port ${httpPort}`));
