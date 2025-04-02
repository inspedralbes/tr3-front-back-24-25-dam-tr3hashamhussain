const Skin = require('../models/SkinModel');

const uploadImage = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No se subió ningún archivo.' });
    }

    const { filename, path: filePath } = req.file;

    try {
        // Guardar en MySQL usando Sequelize
        const newSkin = await Skin.create({
            filename,
            path: filePath,
        });

        // Devolver la URL de la imagen
        const imageUrl = `http://localhost:3000/uploads/${filename}`;
        res.status(200).json({ message: 'Imagen subida y guardada correctamente', imageUrl });
    } catch (err) {
        console.error('Error al guardar la imagen en MySQL:', err);
        res.status(500).json({ message: 'Error al guardar la imagen en MySQL' });
    }
};

module.exports = { uploadImage };