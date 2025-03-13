const express = require('express');
const { uploadSkin, getSkin } = require('../controllers/skinController'); // Ruta correcta
const upload = require('../utils/fileupload'); // Ruta correcta

const router = express.Router();

router.post('/upload', upload.single('file'), uploadSkin);
router.get('/:filename', getSkin);

module.exports = router;