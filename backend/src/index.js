require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const imageRoutes = require('./routes/imageRoutes');
const Stat = require('./models/StatModel');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Sincronizar modelos con la base de datos
const sequelize = require('./config/sequelize');
const Skin = require('./models/SkinModel');

// Sincronizar modelos con la base de datos

// Sincronizar modelos con la base de datos
sequelize.sync({ force: false }) // force: false evita eliminar y recrear las tablas
    .then(() => {
        console.log('Modelos sincronizados con la base de datos.');
    })
    .catch((err) => {
        console.error('Error sincronizando modelos:', err);
    });
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
        // Obtener la última skin subida usando Sequelize
        const lastSkin = await Skin.findOne({
            order: [['id', 'DESC']], // Ordenar por ID de manera descendente
        });

        if (!lastSkin) {
            // No hay skins disponibles
            return res.status(404).json({ message: 'No hay skins disponibles', imageUrl: null });
        }

        const imageUrl = `http://localhost:3000/uploads/${lastSkin.filename}`;
        res.status(200).json({ message: 'Skin encontrada', imageUrl });
    } catch (err) {
        console.error('Error al obtener la skin:', err);
        res.status(500).json({ message: 'Error al obtener la skin' });
    }
});
// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});