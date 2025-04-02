const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

// Definir el modelo Skin
const Skin = sequelize.define('Skin', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    filename: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    path: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    tableName: 'skins', // Nombre de la tabla en la base de datos
    timestamps: false,  // Desactivar createdAt y updatedAt (opcional)
});

module.exports = Skin;