const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../model/user');
const HttpError = require('../utils/httpError');
const asyncHandler = require('./asyncHandler');

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  if (header) return header.trim();
  if (req.body && typeof req.body.token === 'string') return req.body.token;
  return null;
}

const requireAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) throw new HttpError(401, 'Unauthorized');
  let payload;
  try {
    payload = jwt.verify(token, config.accessSecret, { algorithms: ['HS256'] });
  } catch (e) {
    throw new HttpError(401, 'Token tidak valid atau kedaluwarsa');
  }
  const user = await User.findOne({ id: payload.sub }).select('-password -refreshTokens');
  if (!user) throw new HttpError(401, 'Unauthorized');
  req.user = user;
  next();
});

const requireRole = (role) => (req, res, next) => {
  if (req.user.status !== role) return next(new HttpError(403, 'Forbidden'));
  return next();
};

module.exports = { requireAuth, requireRole };
