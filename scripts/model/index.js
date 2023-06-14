/* eslint-disable import/extensions */
/* eslint-disable global-require */
const mongoose = require('mongoose');
const dbConfig = require('../config/database');

mongoose.Promise = global.Promise;
module.exports = {
  mongoose,
  url: dbConfig.url,
  user: require('./user.js')(mongoose),
  pesanan: require('./pesanan.js')(mongoose),
  review: require('./review.js')(mongoose),
  lapangan: require('./lapangan.js')(mongoose),
};
