const mongoose = require('mongoose');

const StatSchema = new mongoose.Schema({
    playerId: { type: String, required: true },
    playerName: { type: String, required: true },
    jumps: { type: Number, default: 0 },
});

module.exports = mongoose.model('Stat', StatSchema);