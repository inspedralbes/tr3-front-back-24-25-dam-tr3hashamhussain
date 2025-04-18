require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io'); // Asegúrate de tener esta línea al inicio

// Configuración inicial
const app = express();
const PORT = process.env.PORT || 3400;
const server = http.createServer(app);

const authenticateAdmin = (req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    console.log('Intento de acceso admin sin token');
    return res.status(401).json({ message: 'Token no proporcionado' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.user?.isAdmin) {
      return res.status(403).json({ message: 'Se requieren privilegios de administrador' });
    }
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};


// Verificación de variables de entorno esenciales
console.log('Game Service iniciado');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '*** (configurado)' : 'NO CONFIGURADO');
if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET no está configurado');
  process.exit(1);
}

// Configuración del archivo de settings
const SETTINGS_FILE = path.join(__dirname, 'gameSettings.json');
let gameSettings = loadSettings();

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});
// Middleware de logging para todas las solicitudes
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Configuración de WebSocket
// En game-service/index.js
// Configura CORS más estrictamente
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080'], // Añade el puerto de Unity
  methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Endpoint de configuración del juego - Asegúrate que sea GET
app.get('/game-settings', (req, res) => {
  res.status(200).json({
    flapStrength: gameSettings.flapStrength,
    pipeSpawnRate: gameSettings.pipeSpawnRate,
    pipeMoveSpeed: gameSettings.pipeMoveSpeed,
    enemySpawnChance: gameSettings.enemySpawnChance,
    timestamp: new Date().toISOString()
  });
});

// Middleware de autenticación JWT
const authenticateJWT = (req, res, next) => {
  // Excluir endpoints públicos
  if (req.path === '/health' || req.method === 'OPTIONS') {
    return next();
  }

  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token inválido o expirado' });
    }
    
    req.user = decoded.user;
    next();
  });
};

app.use(authenticateJWT);

// Funciones para manejar la configuración
function loadSettings() {
  const defaultSettings = {
    flapStrength: 10,
    pipeSpawnRate: 2,
    pipeMoveSpeed: 9.5,
    enemySpawnChance: 25
  };

  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const saved = JSON.parse(fs.readFileSync(SETTINGS_FILE));
      console.log('Configuración cargada:', saved);
      return { ...defaultSettings, ...saved };
    }
    console.log('Usando configuración por defecto');
    return defaultSettings;
  } catch (err) {
    console.error("Error cargando configuración:", err);
    return defaultSettings;
  }
}

function saveSettings(settings) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    console.log('Configuración guardada:', settings);
    return true;
  } catch (err) {
    console.error("Error guardando configuración:", err);
    return false;
  }
}

// Endpoints
app.get('/game-settings', (req, res) => {
  res.status(200).json(gameSettings);
});

app.post('/game-settings', (req, res) => {
  const { flapStrength, pipeSpawnRate, pipeMoveSpeed, enemySpawnChance } = req.body;

  // Validación mejorada
  if (typeof flapStrength !== 'number' || 
      typeof pipeSpawnRate !== 'number' || 
      typeof pipeMoveSpeed !== 'number' || 
      typeof enemySpawnChance !== 'number') {
    return res.status(400).json({ message: 'Todos los valores deben ser números' });
  }

  // Actualizar con límites de seguridad
  const newSettings = {
    flapStrength: Math.max(5, Math.min(20, flapStrength)),
    pipeSpawnRate: Math.max(0.5, Math.min(5, pipeSpawnRate)),
    pipeMoveSpeed: Math.max(1, Math.min(30, pipeMoveSpeed)),
    enemySpawnChance: Math.max(0, Math.min(100, enemySpawnChance))
  };

  gameSettings = newSettings;
  
  if (saveSettings(newSettings)) {
    io.emit('configUpdated', newSettings);
    res.status(200).json({ 
      message: 'Configuración actualizada', 
      gameSettings: newSettings,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(500).json({ message: 'Error al guardar configuración' });
  }
});

// WebSocket events
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  // Enviar configuración actual al nuevo cliente
  socket.emit('configUpdated', gameSettings);

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Ruta de salud
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Game Service',
    uptime: process.uptime(),
    timestamp: new Date()
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error global:', err.stack);
  res.status(500).json({ 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`Servidor Game Service en http://localhost:${PORT}`);
  console.log('Configuración inicial:', gameSettings);
});

// Manejo de cierre
process.on('SIGINT', () => {
  console.log('Guardando configuración antes de cerrar...');
  saveSettings(gameSettings);
  process.exit();
});

// Agregar junto a los otros endpoints
// En cada servicio (auth, game, image, stats)
// En cada servicio
app.use('/api/service', (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar si el usuario es admin
    if (!decoded.user.isAdmin) {
      return res.status(403).json({ message: 'Acceso no autorizado' });
    }
    
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token inválido' });
  }
});

app.post('/api/service/start', (req, res) => {
  res.json({ 
    status: 'running',
    message: `${serviceName} iniciado`
  });
});

app.post('/api/service/stop', (req, res) => {
  res.json({ 
    status: 'stopped',
    message: `${serviceName} detenido`
  });
});
// Endpoint protegido para detener el servicio
app.post('/api/service/stop', authenticateAdmin, (req, res) => {
  res.json({ 
    status: 'stopped',
    message: 'Servicio detenido correctamente'
  });
});
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'running',
    service: serviceName,
    uptime: process.uptime()
  });
});

// Al final de game-service/index.js
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Puedes decidir si cerrar el proceso o no
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});
module.exports = { app, server };