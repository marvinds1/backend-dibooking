const mongoose = require('mongoose');

const { Schema } = mongoose;

const lapanganSchema = new Schema({
  name: {
    type: String, Required: true, min: 5, max: 255,
  },
  pengelola: {
    type: String, Required: true, min: 5, max: 255,
  },
  contact: {
    type: String, Required: true, min: 5, max: 255,
  },
  address: {
    type: String, Required: true, min: 5, max: 255,
  },
  price: {
    type: Number, Required: true, min: 5, max: 255,
  },
  openTime: {
    type: String, Required: true, min: 5, max: 255,
  },
  closeTime: {
    type: String, Required: true, min: 5, max: 255,
  },
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('lapangan', lapanganSchema);
