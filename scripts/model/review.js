const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  id: {
    type: Number, required: true, unique: true, index: true,
  },
  idUser: { type: Number, index: true },
  nameUser: { type: String, required: true },
  idField: { type: Number, required: true, index: true },
  desc: {
    type: String, required: true, minlength: 5, maxlength: 511,
  },
  rating: {
    type: Number, required: true, min: 0, max: 5,
  },
}, { timestamps: true });

module.exports = mongoose.model('review', reviewSchema);
