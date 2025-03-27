require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const imageRoutes = require('./routes/imageRoutes');
const Stat = require('./models/StatModel');
const path = require('path');
const fs = require('fs');
const app = express();
const http = require('http');
const socketIo = require('socket.io');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Configuración CORS para Socket.IO
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:3001', 'http://localhost:3000'], // Permitir Unity y Vuetify
    methods: ['GET', 'POST'],
    credentials: true
  }
});
// Configuración persistente
const SETTINGS_FILE = path.join(__dirname, 'gameSettings.json');
let gameSettings = {
  flapStrength: 10,
  pipeSpawnRate: 2,
  pipeMoveSpeed: 9.5,
  enemySpawnChance: 25
};

// Cargar configuración al iniciar
function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const saved = JSON.parse(fs.readFileSync(SETTINGS_FILE));
      gameSettings = { ...gameSettings, ...saved };
    }
  } catch (err) {
    console.error("Error loading settings:", err);
  }
}

// Guardar configuración
function saveSettings() {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(gameSettings, null, 2));
}

loadSettings();

// Middleware
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Endpoints
app.get('/game-settings', (req, res) => {
  res.status(200).json(gameSettings);
});

app.post('/game-settings', (req, res) => {
  const { flapStrength, pipeSpawnRate, pipeMoveSpeed, enemySpawnChance } = req.body;

  // Validación mejorada
  if ([flapStrength, pipeSpawnRate, pipeMoveSpeed, enemySpawnChance].some(v => isNaN(v))) {
    return res.status(400).json({ message: 'Todos los valores deben ser números válidos' });
  }

  gameSettings = {
    flapStrength: Math.max(5, Math.min(20, Number(flapStrength))),
    pipeSpawnRate: Math.max(0.5, Math.min(5, Number(pipeSpawnRate))),
    pipeMoveSpeed: Math.max(1, Math.min(30, Number(pipeMoveSpeed))),
    enemySpawnChance: Math.max(0, Math.min(100, Number(enemySpawnChance)))
  };

  saveSettings();
  io.emit('configUpdated', gameSettings);
  
  res.status(200).json({ 
    message: 'Configuración actualizada', 
    gameSettings,
    timestamp: new Date().toISOString()
  });
});

// Conexión WebSocket
io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado:', socket.id);

  // Enviar configuración inicial al conectarse
  socket.emit('configUpdated', gameSettings);

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Configuración de CORS para REST API
app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configuración de base de datos y modelos
const sequelize = require('./config/sequelize');
const Skin = require('./models/SkinModel');

sequelize.sync({ force: false })
  .then(() => console.log('Modelos sincronizados con la base de datos.'))
  .catch(err => console.error('Error sincronizando modelos:', err));

// Crear carpeta uploads si no existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log('Carpeta "uploads" creada.');
}

// Conectar a MongoDB
connectDB();

// Rutas
app.use('/images', imageRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Endpoints para estadísticas
app.get('/stats', async (req, res) => {
  try {
    const stats = await Stat.find();
    res.status(200).json(stats);
  } catch (err) {
    console.error('Error al obtener las estadísticas:', err);
    res.status(500).send('Error al obtener las estadísticas');
  }
});

app.get('/stats/recent', async (req, res) => {
  try {
    const recentStat = await Stat.findOne().sort({ date: -1 });
    if (!recentStat) {
      return res.status(404).json({ message: 'No hay partidas registradas' });
    }
    res.status(200).json(recentStat);
  } catch (err) {
    console.error('Error al obtener la partida más reciente:', err);
    res.status(500).json({ message: 'Error al obtener la partida más reciente' });
  }
});

app.post('/stats', async (req, res) => {
  const { playerId, playerName, jumps, pipesPassed, gameMode } = req.body;
  
  try {
    const newStat = new Stat({
      playerId,
      playerName,
      jumps,
      pipesPassed,
      gameMode,
    });

    await newStat.save();
    io.emit('newStat', newStat);
    res.status(201).json({ message: 'Estadística guardada', stat: newStat });
  } catch (err) {
    console.error('Error al guardar la estadística:', err);
    res.status(500).json({ message: 'Error al guardar la estadística' });
  }
});

// Endpoints para configuración del juego

// Endpoint para skins
app.get('/current-skin', async (req, res) => {
  try {
    const lastSkin = await Skin.findOne({ order: [['id', 'DESC']] });
    if (!lastSkin) {
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
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});