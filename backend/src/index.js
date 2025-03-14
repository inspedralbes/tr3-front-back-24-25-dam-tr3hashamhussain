require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const mysql = require('mysql');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Crear la carpeta uploads si no existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
    console.log('Carpeta "uploads" creada.');
}

// Configuración de Multer para subir archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir); // Guardar en src/uploads
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Nombre único
    },
});

const upload = multer({ storage });

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error de conexión a MongoDB:', err));

// Conexión a MySQL sin especificar la base de datos inicial
const db = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    connectTimeout: 10000,
});

// Conectar a MySQL y crear la base de datos si no existe
db.connect((err) => {
    if (err) {
        console.error('Error conectando a MySQL:', err);
        return;
    }
    console.log('Conexión exitosa a MySQL.');

    // Crear la base de datos si no existe
    const createDatabaseQuery = `CREATE DATABASE IF NOT EXISTS ${process.env.MYSQL_DATABASE}`;
    db.query(createDatabaseQuery, (err) => {
        if (err) {
            console.error('Error al crear la base de datos:', err);
            return;
        }
        console.log(`Base de datos "${process.env.MYSQL_DATABASE}" creada o ya existe.`);

        // Usar la base de datos
        db.changeUser({ database: process.env.MYSQL_DATABASE }, (err) => {
            if (err) {
                console.error('Error al seleccionar la base de datos:', err);
                return;
            }
            console.log(`Usando la base de datos "${process.env.MYSQL_DATABASE}".`);

            // Crear la tabla skins si no existe
            const createTableQuery = `
                CREATE TABLE IF NOT EXISTS skins (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    filename VARCHAR(255) NOT NULL,
                    path VARCHAR(255) NOT NULL,
                    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;
            db.query(createTableQuery, (err) => {
                if (err) {
                    console.error('Error al crear la tabla skins:', err);
                    return;
                }
                console.log('Tabla "skins" creada o ya existe.');
            });
        });
    });
});

// Endpoint para subir imágenes
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No se subió ningún archivo.');
    }

    const { filename, path: filePath } = req.file;

    // Guardar la información en MySQL
    const insertQuery = 'INSERT INTO skins (filename, path) VALUES (?, ?)';
    db.query(insertQuery, [filename, filePath], (err) => {
        if (err) {
            console.error('Error al insertar la skin:', err);
            return res.status(500).send('Error al guardar la skin en la base de datos');
        }
        res.status(200).send('Skin subida y guardada correctamente');
    });
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

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});