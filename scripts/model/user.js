const mongoose = require('mongoose');
const locations = require('../data/lokasi');

const { Schema } = mongoose;

const userSchema = new Schema({
  id: { type: Number, Required: true },
  name: {
    type: String, Required: true, min: 5, max: 255,
  },
  nomor_ponsel: {
    type: String, Required: true, min: 5, max: 255,
  },
  email: { type: String, Required: true, max: 255 },
  status: {
    type: String, Required: true, enum: ['Penyewa', 'Pemilik Lapangan'], default: 'Penyewa',
  },
  password: {
    type: String, Required: true, min: 6, max: 500,
  },
  saldo: { type: Number, default: 100000 },
  lokasi: { type: String, enum: locations, default: 'Kota Semarang' },
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  refreshToken: [{ type: String, default: null }],
});

module.exports = mongoose.model('user', userSchema);
