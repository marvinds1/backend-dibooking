const mongoose = require('mongoose');

const { Schema } = mongoose;

const reviewSchema = new Schema({
  id: { type: Number, Required: true },
  nameUser: { type: String, Required: true },
  idField: { type: Number, Required: true },
  desc: {
    type: String, Required: true, min: 5, max: 511,
  },
  rating: {
    type: Number, Required: true, min: 0, max: 5,
  },
  updateAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('review', reviewSchema);
