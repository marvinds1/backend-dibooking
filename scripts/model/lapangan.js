const mongoose = require('mongoose');
const typeField = require('../data/typeLapangan');
const locations = require('../data/lokasi');

const lapanganSchema = new mongoose.Schema({
  idField: {
    type: Number, required: true, unique: true, index: true,
  },
  idManager: { type: Number, required: true, index: true },
  title: {
    type: String, required: true, minlength: 5, maxlength: 255,
  },
  typeField: { type: String, required: true, enum: typeField },
  imageSrc: { type: String, default: '', maxlength: 1024 },
  location: { type: String, required: true, enum: locations },
  description: { type: String, required: true, maxlength: 1000 },
  facilities: { type: mongoose.Schema.Types.Mixed },
  rented: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  address: { type: String, required: true, maxlength: 255 },
  price: { type: Number, required: true, min: 0 },
  openTime: { type: String, required: true },
  closeTime: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('lapangan', lapanganSchema);
