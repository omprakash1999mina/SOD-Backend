// "use strict";
import express from 'express';
import { DB_URL } from './config';
import errorHandler from './middleware/errorHandler';
const PORT = process.env.PORT || 5500;
const app = express();
import routes from './routes';
import mongoose from 'mongoose';
import path from "path";
import PClient from 'prom-client';
import responseTime from 'response-time';
import PrometheusMetricsController from './Services/Prometheus';
// import CustomMetrics from './Services/CustomMetrics';

//Database connection
try {
  mongoose.connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', () => {
    console.log('DB connected...');
  });
} catch (err) {
  console.log('DB connection failed');
}
// global.appRoot = path.resolve(__dirname);
const reqResTime = new PClient.Histogram({
  name: "Server_req_res_time",
  help: "This shows the time taken by a request",
  labelNames: ["status_code", "method", "route"],
  buckets: [1, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 2000],
})

app.use(express.json());
app.use('/api/v1', routes);
app.use(errorHandler);
app.set('view engine', 'ejs');
app.use(responseTime((req, res, time) => {
  reqResTime.labels({
    route: req.url,
    method: req.method,
    status_code: res.statusCode,
  }).observe(time);
}))
// app.use(CustomMetrics.responseTime)

// Route for Metrics data export
app.get('/metrics',PrometheusMetricsController.generate);

//The 404 Route (ALWAYS Keep this as the last route)
app.all('*', (req, res) => {
  res.render('NotFound')
})
app.listen(PORT, () => console.log(`Listening on port ${PORT}.`));