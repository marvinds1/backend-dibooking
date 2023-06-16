const mongoose = require('mongoose');
const typeField = require('../data/typeLapangan');
const locations = require('../data/lokasi');

const { Schema } = mongoose;

const lapanganSchema = new Schema({
  title: {
    type: String, Required: true, min: 5, max: 255,
  },
  idManager: {
    type: Number, Required: true,
  },
  idField: {
    type: Number, Required: true,
  },
  typeField: {
    type: String, Required: true, enum: typeField,
  },
  imageSrc: {
    type: String, Required: true, min: 5, max: 255,
  },
  location: {
    type: String, Required: true, enum: locations,
  },
  description: {
    type: String, Required: true, min: 5, max: 255,
  },
  facilities: {
    type: Number, Required: true, min: 5, max: 255,
  },
  rented: {
    type: Number, Required: true, default: 0,
  },
  rating: {
    type: Number, Required: true, default: 0,
  },
  address: {
    type: String, Required: true, min: 5, max: 255,
  },
  price: {
    type: Number, Required: true,
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
