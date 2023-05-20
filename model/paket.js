const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paketSchema = new Schema({
    pathImg: { type: String, Required: true, max: 255 },
    pic: { type: String, Required: true, max: 255 },
    title: { type: String, Required: true, min: 5, max: 255 },
    desc: { type: String, Required: true, min: 5, max: 255 },
    price: { type: Number, Required: true },
    isFav: { type: Boolean, default: false },
    updateAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Paket', paketSchema);