/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
/* eslint-disable import/order */
const express = require('express');

const app = express();
const dotenv = require('dotenv');
const cors = require('cors');
const db = require('./model');
const authRoute = require('./routes/auth');
const profile = require('./routes/controlUser');
const lapangan = require('./routes/controlLapangan');
const pesanan = require('./routes/controlPesanan');
const review = require('./routes/controlReview');
const updateStatus = require('./utils/updateStatus');
const cookieParser = require('cookie-parser');
const cron = require('node-cron');

const serverTimeout = 60000;

dotenv.config();
const dbConfig = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
};

db.mongoose.connect(db.url, dbConfig)
  .then(() => { console.log('Connected to the database!'); })
  .catch((err) => {
    console.log('Cannot connect to the database!', err); process.exit();
  });

app.timeout = serverTimeout;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', '*');
  next();
});
app.use(cookieParser());
app.use(express.json());
app.use(cors());
app.use('/api/user', authRoute);
app.use('/api/detail', profile);
app.use('/api/lapangan', lapangan);
app.use('/api/pemesanan', pesanan);
app.use('/api/review', review);

cron.schedule('*/10 * * * *', () => {
  updateStatus();
  console.log('Cron Job for Update Status is running');
});

exports.app = app;
console.log('Cron Job for Update Status is running');
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
