import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { PORT } from './config/env';
import router from './router/router';

const app = express();

app.use(cors())

app.use(bodyParser.json());

app.use('/api', router);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});