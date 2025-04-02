require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken'); // Añadir esta línea
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3200;

// Verificar JWT_SECRET
if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET no está configurado en .env');
  process.exit(1);
}

// Configuración de tiempo de inicio del servidor
app.set('serverStartTime', Date.now());
process.serverStartTime = app.get('serverStartTime');

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración CORS mejorada
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // Permitir ambos puertos comunes
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para verificar token JWT
app.use('/images', (req, res, next) => {
  // Permitir OPTIONS para CORS
  if (req.method === 'OPTIONS') return next();
  
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    console.log('Intento de acceso sin token a:', req.path);
    return res.status(401).json({ message: 'Token no proporcionado' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error('Error verificando token:', err.message);
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
});

// Configuración de base de datos
const sequelize = require('./config/sequelize');
const Skin = require('./models/SkinModel');

// Sincronización de modelos
sequelize.sync({ force: false })
  .then(() => console.log('Modelos de Image sincronizados con la base de datos.'))
  .catch(err => console.error('Error sincronizando modelos Image:', err));

// Crear carpeta uploads si no existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log('Carpeta "uploads" creada.');
}

// Rutas
const imageRoutes = require('./routes/imageRoutes');
app.use('/images', imageRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Endpoint para skins
app.get('/current-skin', async (req, res) => {
  try {
    const lastSkin = await Skin.findOne({ order: [['id', 'DESC']] });
    if (!lastSkin) {
      return res.status(404).json({ message: 'No hay skins disponibles', imageUrl: null });
    }
    const imageUrl = `http://localhost:${PORT}/uploads/${lastSkin.filename}`;
    res.status(200).json({ message: 'Skin encontrada', imageUrl });
  } catch (err) {
    console.error('Error al obtener la skin:', err);
    res.status(500).json({ message: 'Error al obtener la skin' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Image Service corriendo en http://localhost:${PORT}`);
});