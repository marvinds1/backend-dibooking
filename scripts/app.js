const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const config = require('./config/env');
const { connect } = require('./config/db');
const asyncHandler = require('./middleware/asyncHandler');
const errorHandler = require('./middleware/errorHandler');
const updateStatus = require('./utils/updateStatus');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', config.trustProxy);
app.use(helmet());
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.get('/healthz', (req, res) => res.json({ status: 'ok' }));

app.use(asyncHandler(async (req, res, next) => {
  await connect();
  next();
}));

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/controlUser');
const lapanganRoutes = require('./routes/controlLapangan');
const pesananRoutes = require('./routes/controlPesanan');
const reviewRoutes = require('./routes/controlReview');

app.use('/api/user', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/detail', userRoutes);
app.use('/api/lapangan', lapanganRoutes);
app.use('/api/pemesanan', pesananRoutes);
app.use('/api/review', reviewRoutes);

const safeEqual = (a, b) => {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
};

app.get('/api/internal/cron/update-status', asyncHandler(async (req, res) => {
  const expected = `Bearer ${config.cronSecret}`;
  if (!config.cronSecret || !safeEqual(req.headers.authorization || '', expected)) {
    return res.sendStatus(401);
  }
  return res.json(await updateStatus());
}));

app.use((req, res) => res.status(404).json({ message: 'Not found' }));
app.use(errorHandler);

module.exports = app;
