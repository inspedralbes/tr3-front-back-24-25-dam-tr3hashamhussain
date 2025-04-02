const mongoose = require('mongoose');

const StatSchema = new mongoose.Schema({
    playerId: { type: String, required: true }, // ID del jugador
    playerName: { type: String, required: true }, // Nombre del jugador
    jumps: { type: Number, default: 0 }, // Saltos realizados
    pipesPassed: { type: Number, default: 0 }, // Tuberías pasadas
    gameMode: { type: String, required: true }, // Modo de juego (M-Facil, M-Normal, M-Dificil)
    date: { type: Date, default: Date.now }, // Fecha de la partida
});

module.exports = mongoose.model('Stat', StatSchema);