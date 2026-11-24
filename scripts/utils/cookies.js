const config = require('../config/env');

const REFRESH_COOKIE = 'refreshToken';

const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: config.isProduction,
  sameSite: config.isProduction ? 'none' : 'lax',
  path: '/api/user',
});

module.exports = { REFRESH_COOKIE, refreshCookieOptions };
