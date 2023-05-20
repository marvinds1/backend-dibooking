const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: { type: String, Required: true, min: 5, max: 255 },
    email: { type: String, Required: true, max: 255 },
    address: { type: String, Required: true, min: 5, max: 255 },
    password: { type: String, Required: true, min: 6, max: 500 },
    updatedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    refreshToken: [{ type: String, default: null }]
});

module.exports = mongoose.model('User', userSchema);