import WebSocket, { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('User connected');
  let data;

  ws.on('error', console.error);

  ws.on('message', (data) => console.log(`received ${data}`));

  ws.send('connected');
});

