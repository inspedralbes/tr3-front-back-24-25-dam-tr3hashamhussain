require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');
const app = express();
const PORT = process.env.PORT || 3200;
const server = require('http').createServer(app);

// Verificar variables de entorno esenciales
if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET no está configurado en .env');
  process.exit(1);
}

// Configuración de tiempo de inicio del servidor
app.set('serverStartTime', Date.now());
process.serverStartTime = app.get('serverStartTime');

// Configuración de base de datos
// Configuración de base de datos
const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || 'flappybird_mysql', // Usa el nombre de tu base de datos
  process.env.MYSQL_USER || 'root',
  process.env.MYSQL_PASSWORD || '',
  {
    host: process.env.MYSQL_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      connectTimeout: 60000 // Aumenta el timeout de conexión
    },
    retry: {
      max: 5, // Número máximo de intentos de conexión
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /ESOCKETTIMEDOUT/,
        /EHOSTDOWN/,
        /EPIPE/,
        /EAI_AGAIN/,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/
      ]
    }
  }
);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Middleware para autenticación de administradores
// Middleware para autenticación de administradores
const authenticateAdmin = (req, res, next) => {
  // Permitir OPTIONS para CORS
  if (req.method === 'OPTIONS') return next();
  
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    console.log('Intento de acceso admin sin token a:', req.path);
    return res.status(401).json({ message: 'Token no proporcionado' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded.user.isAdmin) {
      console.log(`Usuario ${decoded.user.email} intentó acceder a función admin`);
      return res.status(403).json({ message: 'Se requieren privilegios de administrador' });
    }
    
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error('Error verificando token admin:', err.message);
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

// Middleware para rutas protegidas normales
app.use('/images', (req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
});

// Configuración de uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log('Carpeta "uploads" creada.');
}

// Función para obtener espacio en disco
const getDiskSpaceInfo = () => {
  try {
    const stats = fs.statSync(uploadsDir);
    return {
      free: (stats.blocks * stats.blksize / (1024 * 1024)).toFixed(2) + ' MB',
      total: (stats.blocks * stats.blksize / (1024 * 1024)).toFixed(2) + ' MB'
    };
  } catch (err) {
    return { error: err.message };
  }
};

// Modelos
const Skin = require('./models/SkinModel');

// Rutas
const imageRoutes = require('./routes/imageRoutes');
app.use('/images', imageRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Endpoint para skins
app.get('/current-skin', async (req, res) => {
  try {
    const lastSkin = await Skin.findOne({ order: [['id', 'DESC']] });
    if (!lastSkin) {
      return res.status(404).json({ 
        message: 'No hay skins disponibles', 
        imageUrl: null 
      });
    }
    const imageUrl = `/uploads/${lastSkin.filename}`;
    res.status(200).json({ message: 'Skin encontrada', imageUrl });
  } catch (err) {
    console.error('Error al obtener la skin:', err);
    res.status(500).json({ message: 'Error al obtener la skin' });
  }
});

// Endpoints de control del servicio
app.get('/health', async (req, res) => {
  try {
    // Verificar conexión a la base de datos
    await sequelize.authenticate();
    
    res.status(200).json({
      status: 'running',
      service: 'Image Service',
      database: 'connected',
      uptime: process.uptime(),
      uploadsDir: fs.existsSync(uploadsDir) ? 'OK' : 'Missing',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(200).json({
      status: 'running',
      service: 'Image Service',
      database: 'disconnected',
      error: err.message,
      uptime: process.uptime()
    });
  }
});

app.post('/api/service/start', authenticateAdmin, (req, res) => {
  res.json({ 
    status: 'running',
    message: 'Image Service iniciado',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/service/stop', authenticateAdmin, (req, res) => {
  res.json({ 
    status: 'stopped',
    message: 'Image Service detenido correctamente',
    timestamp: new Date().toISOString()
  });
  
  // Cierre ordenado después de responder
  setTimeout(() => {
    console.log('Cerrando Image Service...');
    server.close(() => {
      sequelize.close().then(() => {
        process.exit(0);
      });
    });
  }, 100);
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error global:', err.stack);
  res.status(500).json({ 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Iniciar servidor
sequelize.sync({ force: false })
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Image Service corriendo en http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error al iniciar el servicio:', err);
    process.exit(1);
  });

// Manejo de cierre
process.on('SIGINT', () => {
  console.log('Recibida señal SIGINT. Cerrando Image Service...');
  server.close(() => {
    sequelize.close().then(() => {
      process.exit(0);
    });
  });
});