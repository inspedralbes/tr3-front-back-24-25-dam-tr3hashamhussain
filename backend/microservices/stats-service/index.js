require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Stat = require('./models/StatModel');

// Configuración inicial
const app = express();
const PORT = process.env.PORT || 3300;

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración CORS más flexible para desarrollo
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // Agrega todos los puertos posibles del frontend
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware de logging para todas las solicitudes
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Middleware de autenticación JWT para rutas protegidas
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        console.error('JWT verification error:', err);
        return res.sendStatus(403);
      }
      
      req.user = user;
      next();
    });
  } else {
    console.log('No auth header present');
    res.sendStatus(401);
  }
};

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => {
    console.error('Error de conexión a MongoDB:', err);
    process.exit(1);
  });

// Ruta de verificación de salud del servicio
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Stats Service is running',
    timestamp: new Date()
  });
});

// Rutas protegidas
app.use('/stats', authenticateJWT);

// Obtener todas las estadísticas
app.get('/stats', async (req, res) => {
  try {
    console.log('User making request:', req.user);
    const stats = await Stat.find().sort({ date: -1 }).limit(100);
    res.status(200).json(stats);
  } catch (err) {
    console.error('Error al obtener estadísticas:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener estadística más reciente
app.get('/stats/recent', async (req, res) => {
  try {
    const recentStat = await Stat.findOne().sort({ date: -1 });
    if (!recentStat) {
      return res.status(404).json({ message: 'No hay partidas registradas' });
    }
    res.status(200).json(recentStat);
  } catch (err) {
    console.error('Error al obtener estadística reciente:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Guardar nueva estadística
app.post('/stats', async (req, res) => {
  try {
    const { playerId, playerName, jumps, pipesPassed, gameMode } = req.body;
    
    if (!playerId || !playerName || !gameMode) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }

    const newStat = new Stat({
      playerId,
      playerName,
      jumps: jumps || 0,
      pipesPassed: pipesPassed || 0,
      gameMode,
      date: new Date()
    });

    await newStat.save();
    
    // Emitir evento de nueva estadística (para WebSockets si estuvieran configurados)
    // io.emit('newStat', newStat);
    
    res.status(201).json(newStat);
  } catch (err) {
    console.error('Error al guardar estadística:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error global:', err);
  res.status(500).json({ message: 'Algo salió mal en el servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Stats Service running on http://localhost:${PORT}`);
  console.log('Environment variables:');
  console.log('- MONGO_URI:', process.env.MONGO_URI ? '*** (configured)' : 'NOT CONFIGURED');
  console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '*** (configured)' : 'NOT CONFIGURED');
});

// Exportar para testing
module.exports = app;