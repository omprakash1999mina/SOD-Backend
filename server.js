// "use strict";
import express from 'express';
import { APP_PORT, DB_URL } from './config';
import errorHandler from './middleware/errorHandler';
const PORT = process.env.PORT || 5000;
const app = express();
import routes from './routes';
import mongoose from 'mongoose';
import path from "path";
import cors from "cors";

global.appRoot = path.resolve(__dirname);
app.use(cors({
  origin: '*',
  methods: ["GET", "POST", "DELETE", "PUT"]
}));

//Database connection
try {

  // mongoose.connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
  mongoose.connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', () => {
    console.log('DB connected...');
  });
} catch (err) {
  console.log('DB connection faild');
}

app.use(express.json());
app.use('/api/v1', routes);
app.use(errorHandler);
app.set('view engine', 'ejs');

//The 404 Route (ALWAYS Keep this as the last route)
app.all('*', (req, res) => {
  res.render('NotFound')
})

app.listen(PORT, () => console.log(`Listening on port ${PORT}. `));