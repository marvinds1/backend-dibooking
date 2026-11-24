const mongoose = require('mongoose');
const locations = require('../data/lokasi');

const userSchema = new mongoose.Schema({
  id: {
    type: Number, required: true, unique: true, index: true,
  },
  name: {
    type: String, required: true, minlength: 3, maxlength: 100,
  },
  nomor_ponsel: { type: String, required: true, maxlength: 20 },
  email: {
    type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 255,
  },
  status: {
    type: String, required: true, enum: ['Penyewa', 'Pemilik Lapangan'], default: 'Penyewa',
  },
  password: { type: String, required: true, select: false },
  saldo: { type: Number, default: 100000, min: 0 },
  lokasi: { type: String, enum: locations, default: 'Kota Semarang' },
  refreshTokens: { type: [String], default: [], select: false },
}, { timestamps: true });

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    const {
      password, refreshTokens, __v, ...safe
    } = ret;
    return safe;
  },
});

module.exports = mongoose.model('user', userSchema);
