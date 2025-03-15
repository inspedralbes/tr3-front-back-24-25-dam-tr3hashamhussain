const db = require('../config/mysql');
const path = require('path');

const uploadImage = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No se subió ningún archivo.' });
    }

    const { filename, path: filePath } = req.file;

    // Guardar en MySQL
    const insertMySQLQuery = 'INSERT INTO skins (filename, path) VALUES (?, ?)';
    db.query(insertMySQLQuery, [filename, filePath], (err) => {
        if (err) {
            console.error('Error al insertar la imagen en MySQL:', err);
            return res.status(500).json({ message: 'Error al guardar la imagen en MySQL' });
        }
        console.log('Imagen guardada en MySQL.');

        // Devolver la URL de la imagen
        const imageUrl = `http://localhost:3000/uploads/${filename}`;
        res.status(200).json({ message: 'Imagen subida y guardada correctamente', imageUrl });
    });
};

module.exports = { uploadImage };