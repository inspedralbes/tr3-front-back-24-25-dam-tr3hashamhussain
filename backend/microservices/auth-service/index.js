require('dotenv').config();
console.log('Variables de entorno cargadas para Auth Service:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '*** (configurado)' : 'NO CONFIGURADO');
console.log('MYSQL_HOST:', process.env.MYSQL_HOST);

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3100;

// Configuración de tiempo de inicio del servidor
app.set('serverStartTime', Date.now());
process.serverStartTime = app.get('serverStartTime');

// Middleware para verificar reinicio del servidor
app.use((req, res, next) => {
  if (process.serverStartTime !== req.app.get('serverStartTime')) {
    return res.status(401).json({ message: 'Server restarted, please login again' });
  }
  next();
});

// Configuración de base de datos
const sequelize = require('./config/sequelize');
const User = require('./models/UserModel');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración CORS
app.use(cors({
  origin: ['http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para verificar token en rutas protegidas
app.use('/api/auth', (req, res, next) => {
  if (req.path === '/login' || req.path === '/register' || req.path === '/check') {
    return next();
  }
  
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Acceso no autorizado' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token inválido' });
  }
});

// Sincronización de modelos
sequelize.sync({ force: false })
  .then(() => console.log('Modelos de Auth sincronizados con la base de datos.'))
  .catch(err => console.error('Error sincronizando modelos Auth:', err));

// Rutas
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Auth Service corriendo en http://localhost:${PORT}`);
});