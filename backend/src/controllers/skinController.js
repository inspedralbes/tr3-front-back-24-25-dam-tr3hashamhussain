const Skin = require('../models/SkinModel');
const fs = require('fs');
const path = require('path');

const uploadSkin = async (req, res) => {
    try {
        const { filename, path: filePath } = req.file;
        const newSkin = new Skin({ filename, path: filePath });
        await newSkin.save();
        res.status(201).json({ message: 'Skin subida correctamente', skin: newSkin });
    } catch (err) {
        res.status(500).json({ message: 'Error al subir la skin', error: err });
    }
};

const getSkin = async (req, res) => {
    try {
        const skin = await Skin.findOne({ filename: req.params.filename });
        if (!skin) {
            return res.status(404).json({ message: 'Skin no encontrada' });
        }
        res.sendFile(path.resolve(skin.path));
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener la skin', error: err });
    }
};

module.exports = { uploadSkin, getSkin };