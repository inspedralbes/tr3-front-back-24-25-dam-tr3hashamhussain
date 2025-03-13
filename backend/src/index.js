const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const skinRoutes = require('./routes/skinRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error de conexión a MongoDB:', err));

// Middleware
app.use(express.json());

// Rutas
app.use('/api/skins', skinRoutes);

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});