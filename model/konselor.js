const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const konselorSchema = new Schema({
    pathImg: { type: String, Required: true, max: 255 },
    name: { type: String, Required: true, max: 255 },
    desc: { type: String, Required: true, min: 5, max: 255 },
    role: { type: String, Required: true, min: 5, max: 255 },
    updateAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Konselor', konselorSchema);