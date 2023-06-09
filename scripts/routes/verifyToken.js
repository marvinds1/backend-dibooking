/* eslint-disable func-names */
/* eslint-disable consistent-return */
const jwt = require('jsonwebtoken');
const process = require('process');

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader;
  if (token == null) return res.sendStatus(401);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(404);
    req.user = user;
    next();
  });
};
