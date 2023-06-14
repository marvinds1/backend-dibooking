const mongoose = require('mongoose');

const { Schema } = mongoose;

const pesananSchema = new Schema({
  lapanganname: {
    type: String, Required: true, min: 5, max: 255,
  },
  address: {
    type: String, Required: true, min: 5, max: 255,
  },
  password: {
    type: String, Required: true, min: 6, max: 500,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('pesanan', pesananSchema);
