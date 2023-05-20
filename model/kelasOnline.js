const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const kelasOnline = new Schema({
    title: { type: String, Required: true, min: 5, max: 255 },
    pathImg: { type: String, Required: true, max: 255 },
    updatedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('kelasOnline', kelasOnline);