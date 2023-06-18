/* eslint-disable no-console */
/* eslint-disable import/order */
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const dotenv = require('dotenv');
const cors = require('cors');
const db = require('./model');
const authRoute = require('./routes/auth');
const profile = require('./routes/controlUser');
const lapangan = require('./routes/controlLapangan');
const pesanan = require('./routes/controlPesanan');
const review = require('./routes/controlReview');
const cookieParser = require('cookie-parser');

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

app.use('/api', createProxyMiddleware({
  target: 'https://backend-dibooking.vercel.app',
  changeOrigin: true,
}));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://frontend-dibooking.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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

exports.app = app;

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
