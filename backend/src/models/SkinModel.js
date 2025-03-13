const mongoose = require('mongoose');

const skinSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    path: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Skin', skinSchema);