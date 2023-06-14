const mongoose = require('mongoose');

const { Schema } = mongoose;

const reviewSchema = new Schema({
  username: { type: String, Required: true, max: 255 },
  desc: {
    type: String, Required: true, min: 5, max: 511,
  },
  rating: {
    type: Number, Required: true, min: 1, max: 5,
  },
  updateAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('review', reviewSchema);
