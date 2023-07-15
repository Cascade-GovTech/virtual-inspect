import express from 'express';
import * as url from 'url';

const app = express();

app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(`${url.fileURLToPath(new URL('.', import.meta.url))}/js`));
app.use(express.static(`${url.fileURLToPath(new URL('.', import.meta.url))}/public`));

app.get('/', (req, res) => {
  res.render('index');
});

export default app;

