require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const db = require('./config/mysql');
const imageRoutes = require('./routes/imageRoutes');
const Stat = require('./models/StatModel');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configurar CORS
app.use(cors({
    origin: 'http://localhost:3001', // Permitir solicitudes desde el frontend
    methods: ['GET', 'POST'], // Métodos permitidos
}));

// Crear la carpeta uploads si no existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
    console.log('Carpeta "uploads" creada.');
}

// Conectar a MongoDB
connectDB();

// Middleware para parsear JSON
app.use(express.json());

// Rutas para imágenes
app.use('/images', imageRoutes); // Montar las rutas de imágenes en /images

// Endpoint para obtener estadísticas (MongoDB)
app.get('/stats', async (req, res) => {
    try {
        const stats = await Stat.find(); // Obtener todas las estadísticas
        res.status(200).json(stats);
    } catch (err) {
        console.error('Error al obtener las estadísticas:', err);
        res.status(500).send('Error al obtener las estadísticas');
    }
});

// Endpoint para listar imágenes
app.get('/images', (req, res) => {
    fs.readdir(uploadsDir, (err, files) => {
        if (err) {
            return res.status(500).send('Error al leer la carpeta uploads');
        }
        res.json(files);
    });
});
app.get('/current-skin', async (req, res) => {
    try {
        // Obtener la última skin subida desde MySQL
        const query = 'SELECT filename FROM skins ORDER BY id DESC LIMIT 1';
        db.query(query, (err, results) => {
            if (err) {
                console.error('Error al obtener la skin:', err);
                return res.status(500).json({ message: 'Error al obtener la skin' });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: 'No se encontró ninguna skin' });
            }

            const filename = results[0].filename;
            const imageUrl = `http://localhost:3000/uploads/${filename}`;
            res.status(200).json({ imageUrl });
        });
    } catch (err) {
        console.error('Error al obtener la skin:', err);
        res.status(500).json({ message: 'Error al obtener la skin' });
    }
});
// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});