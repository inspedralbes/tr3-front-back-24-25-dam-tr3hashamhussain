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


app.use(express.urlencoded({ extended: true })); // Permite recibir datos en formularios

const PORT = process.env.PORT || 3000;
// Crear un servidor HTTP
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3001', // Permitir conexiones desde el frontend
    methods: ['GET', 'POST'],
  },
});

// Configurar eventos de WebSocket
io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado:', socket.id);
  
    // Manejar la desconexión del cliente
    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
    });
  });
// Almacenar los valores en memoria (o en una base de datos)
let gameSettings = {
    flapStrength: 10,
    pipeSpawnRate: 2,
    pipeMoveSpeed: 9.5, // Nueva propiedad: velocidad de las tuberías
    enemySpawnChance: 25, // Nueva propiedad: % de aparición de enemigos (25% por defecto)
};

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Sincronizar modelos con la base de datos
const sequelize = require('./config/sequelize');
const Skin = require('./models/SkinModel');


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
// Endpoint para obtener la partida más reciente
app.get('/stats/recent', async (req, res) => {
    try {
        // Obtener la partida más reciente
        const recentStat = await Stat.findOne().sort({ date: -1 }); // Ordenar por fecha descendente
        if (!recentStat) {
            return res.status(404).json({ message: 'No hay partidas registradas' });
        }
        res.status(200).json(recentStat);
    } catch (err) {
        console.error('Error al obtener la partida más reciente:', err);
        res.status(500).json({ message: 'Error al obtener la partida más reciente' });
    }
});
// Endpoint para guardar estadísticas de una partida
// Endpoint para guardar estadísticas de una partida
app.post('/stats', async (req, res) => {
    const { playerId, playerName, jumps, pipesPassed, gameMode } = req.body;
  
    try {
      // Crear una nueva estadística
      const newStat = new Stat({
        playerId,
        playerName,
        jumps,
        pipesPassed,
        gameMode,
      });
  
      // Guardar en MongoDB
      await newStat.save();
  
      // Emitir un evento a todos los clientes conectados
      io.emit('newStat', newStat); // Enviar la nueva estadística a todos los clientes
  
      res.status(201).json({ message: 'Estadística guardada correctamente', stat: newStat });
    } catch (err) {
      console.error('Error al guardar la estadística:', err);
      res.status(500).json({ message: 'Error al guardar la estadística' });
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

app.post('/game-settings', (req, res) => {
    const { flapStrength, pipeSpawnRate, pipeMoveSpeed, enemySpawnChance } = req.body;

    // Validar los valores
    if (flapStrength && pipeSpawnRate && pipeMoveSpeed && enemySpawnChance) {
        gameSettings = { 
            flapStrength, 
            pipeSpawnRate, 
            pipeMoveSpeed, 
            enemySpawnChance 
        };
        res.status(200).json({ message: 'Configuración actualizada', gameSettings });
    } else {
        res.status(400).json({ message: 'Datos inválidos' });
    }
});

// Endpoint para obtener la configuración del juego
app.get('/game-settings', (req, res) => {
    res.status(200).json(gameSettings);
});
// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});