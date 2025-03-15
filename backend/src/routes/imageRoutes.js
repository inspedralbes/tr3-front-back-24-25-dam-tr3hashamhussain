const express = require('express');
const { uploadImage } = require('../controllers/imageController');
const upload = require('../utils/fileupload');

const router = express.Router();

// Ruta para subir imágenes
router.post('/upload', upload.single('file'), uploadImage);

module.exports = router;