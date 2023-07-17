import express from 'express';
import * as url from 'url';
import { getRooms, addRoom, removeRoom } from './rooms.js';

const app = express();

const rooms = {};

app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(`${url.fileURLToPath(new URL('.', import.meta.url))}/js`));
app.use(express.static(`${url.fileURLToPath(new URL('.', import.meta.url))}/public`));

app.get('/', (req, res) => {
  res.render('host');
});

app.get('/inspection/:id', (req, res) => {
  console.log(req.params.id);
  res.render('guest')
});

export default app;

