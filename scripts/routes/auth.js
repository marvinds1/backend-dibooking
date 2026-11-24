const router = require('express').Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const config = require('../config/env');
const User = require('../model/user');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const schemas = require('../utils/validation');
const { insertWithUniqueId } = require('../utils/ids');
const HttpError = require('../utils/httpError');
const { REFRESH_COOKIE, refreshCookieOptions } = require('../utils/cookies');

const MAX_SESSIONS = 5;
const DUMMY_HASH = bcrypt.hashSync('timing-equalizer', 10);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Terlalu banyak percobaan, coba lagi nanti' },
});

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const signAccess = (user) => jwt.sign(
  { sub: user.id, role: user.status },
  config.accessSecret,
  { expiresIn: config.accessTtl, algorithm: 'HS256' },
);

const signRefresh = (user) => jwt.sign(
  { sub: user.id, jti: crypto.randomUUID() },
  config.refreshSecret,
  { expiresIn: config.refreshTtl, algorithm: 'HS256' },
);

const cookieOptions = () => ({ ...refreshCookieOptions(), maxAge: 7 * 24 * 60 * 60 * 1000 });

async function issueSession(res, user) {
  const refreshToken = signRefresh(user);
  await User.updateOne({ id: user.id }, {
    $push: { refreshTokens: { $each: [hashToken(refreshToken)], $slice: -MAX_SESSIONS } },
  });
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions());
  return signAccess(user);
}

router.post('/register', authLimiter, validate(schemas.register), asyncHandler(async (req, res) => {
  const { body } = req;
  const password = await bcrypt.hash(body.password, 12);
  try {
    const user = await insertWithUniqueId(User, () => ({
      name: body.name,
      email: body.email,
      nomor_ponsel: body.nomor_ponsel,
      status: body.daftar_sebagai,
      password,
    }), 'id');
    res.status(201).json({ user: user.id });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
      throw new HttpError(409, 'Email address already exists');
    }
    throw err;
  }
}));

router.post('/login', authLimiter, validate(schemas.login), asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+password');
  const valid = await bcrypt.compare(req.body.password, user ? user.password : DUMMY_HASH);
  if (!user || !valid || user.status !== req.body.daftar_sebagai) {
    throw new HttpError(401, 'Email or password is wrong');
  }
  const token = await issueSession(res, user);
  res.json({ token });
}));

router.post('/token', asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) throw new HttpError(401, 'Unauthorized');
  let payload;
  try {
    payload = jwt.verify(refreshToken, config.refreshSecret, { algorithms: ['HS256'] });
  } catch (e) {
    throw new HttpError(401, 'Unauthorized');
  }
  const user = await User.findOneAndUpdate(
    { id: payload.sub, refreshTokens: hashToken(refreshToken) },
    { $pull: { refreshTokens: hashToken(refreshToken) } },
  );
  if (!user) {
    await User.updateOne({ id: payload.sub }, { $set: { refreshTokens: [] } });
    throw new HttpError(401, 'Refresh token reuse detected');
  }
  const token = await issueSession(res, user);
  res.json({ token });
}));

router.delete('/logout', asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;
  if (refreshToken) {
    await User.updateOne(
      { refreshTokens: hashToken(refreshToken) },
      { $pull: { refreshTokens: hashToken(refreshToken) } },
    );
  }
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
  res.sendStatus(204);
}));

module.exports = router;
