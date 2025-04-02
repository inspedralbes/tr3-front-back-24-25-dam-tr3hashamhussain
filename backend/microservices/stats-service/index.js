require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const http = require('http');
const Stat = require('./models/StatModel');

// Configuración inicial
const app = express();
const PORT = process.env.PORT || 3300;
const server = http.createServer(app);

// Verificar variables de entorno esenciales
if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET no está configurado en .env');
  process.exit(1);
}

if (!process.env.MONGO_URI) {
  console.error('ERROR: MONGO_URI no está configurado en .env');
  process.exit(1);
}

// Middlewares
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));

// Middleware para verificar reinicio del servidor
app.use((req, res, next) => {
  if (process.serverStartTime !== req.app.get('serverStartTime')) {
    return res.status(401).json({ message: 'Server restarted, please refresh' });
  }
  next();
});

// Middleware para autenticación de administradores
const authenticateAdmin = (req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    console.log('Intento de acceso admin sin token a:', req.path);
    return res.status(401).json({ message: 'Token no proporcionado' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded.user?.isAdmin) {
      console.log(`Usuario ${decoded.user?.email} intentó acceder a función admin`);
      return res.status(403).json({ message: 'Se requieren privilegios de administrador' });
    }
    
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error('Error verificando token admin:', err.message);
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

// Conexión a MongoDB con manejo mejorado de errores
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: true,
  w: 'majority'
})
.then(() => {
  console.log('Conectado a MongoDB');
  mongoose.connection.on('error', err => {
    console.error('Error de conexión MongoDB:', err);
  });
})
.catch(err => {
  console.error('Error inicial de conexión a MongoDB:', err);
  process.exit(1);
});

// Endpoint público de health check mejorado
app.get('/health', async (req, res) => {
  try {
    // Verificar conexión a MongoDB
    await mongoose.connection.db.admin().ping();
    
    const statsCount = await Stat.estimatedDocumentCount();
    
    res.status(200).json({
      status: 'running',
      service: 'Stats Service',
      database: 'connected',
      statsCount,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Health check error:', err);
    res.status(200).json({
      status: 'running',
      service: 'Stats Service',
      database: 'disconnected',
      error: err.message,
      uptime: process.uptime()
    });
  }
});

// Endpoints protegidos de administración
app.post('/api/service/start', authenticateAdmin, (req, res) => {
  res.json({ 
    status: 'running',
    message: 'Stats Service iniciado',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/service/stop', authenticateAdmin, (req, res) => {
  res.json({ 
    status: 'stopped',
    message: 'Stats Service detenido correctamente',
    timestamp: new Date().toISOString()
  });
  
  // Cierre ordenado con manejo de promesas
  setTimeout(async () => {
    try {
      console.log('Cerrando Stats Service...');
      await new Promise((resolve) => server.close(resolve));
      await mongoose.connection.close();
      process.exit(0);
    } catch (err) {
      console.error('Error al cerrar el servicio:', err);
      process.exit(1);
    }
  }, 100);
});

// Endpoints de estadísticas
app.post('/stats', async (req, res) => {
  try {
    const { playerId, playerName, jumps, pipesPassed, gameMode } = req.body;
    
    const newStat = new Stat({
      playerId,
      playerName: playerName || 'Jugador',
      jumps: jumps || 0,
      pipesPassed: pipesPassed || 0,
      gameMode,
      date: new Date()
    });

    await newStat.save();
    res.status(201).json(newStat);
  } catch (err) {
    console.error('Error al guardar estadística:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.get('/stats', async (req, res) => {
  try {
    const stats = await Stat.find().sort({ date: -1 }).limit(100);
    res.status(200).json(stats);
  } catch (err) {
    console.error('Error al obtener estadísticas:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.get('/stats/recent', async (req, res) => {
  try {
    const recentStat = await Stat.findOne().sort({ date: -1 });
    res.status(200).json(recentStat || {});
  } catch (err) {
    console.error('Error al obtener estadística reciente:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error global:', err.stack);
  res.status(500).json({ 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Configuración de tiempo de inicio del servidor
app.set('serverStartTime', Date.now());
process.serverStartTime = app.get('serverStartTime');

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`Servidor Stats Service corriendo en http://localhost:${PORT}`);
});

// Manejo de señales para cierre limpio
const shutdown = async () => {
  try {
    console.log('Recibida señal de cierre. Cerrando Stats Service...');
    await new Promise((resolve) => server.close(resolve));
    await mongoose.connection.close();
    console.log('Conexiones cerradas correctamente');
    process.exit(0);
  } catch (err) {
    console.error('Error durante el cierre:', err);
    process.exit(1);
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);