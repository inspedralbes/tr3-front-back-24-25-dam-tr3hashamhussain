const { Sequelize } = require('sequelize');

// Función para crear la base de datos si no existe
const createDatabaseIfNotExists = async () => {
    // Conexión sin especificar la base de datos
    const sequelize = new Sequelize('', process.env.MYSQL_USER, process.env.MYSQL_PASSWORD, {
        host: process.env.MYSQL_HOST,
        dialect: 'mysql',
        logging: false,
    });

    try {
        // Verificar si la base de datos existe
        await sequelize.query(`CREATE DATABASE IF NOT EXISTS ${process.env.MYSQL_DATABASE};`);
        console.log(`Base de datos "${process.env.MYSQL_DATABASE}" verificada o creada.`);
    } catch (err) {
        console.error('Error creando la base de datos:', err);
    } finally {
        await sequelize.close(); // Cerrar la conexión temporal
    }
};

// Llamar a la función para crear la base de datos si no existe
createDatabaseIfNotExists();

// Configuración de la conexión a la base de datos
const sequelize = new Sequelize(
    process.env.MYSQL_DATABASE, // Nombre de la base de datos
    process.env.MYSQL_USER,     // Usuario de MySQL
    process.env.MYSQL_PASSWORD, // Contraseña de MySQL
    {
        host: process.env.MYSQL_HOST, // Host de MySQL
        dialect: 'mysql',             // Usar MySQL
        logging: false,               // Desactivar logs de Sequelize (opcional)
    }
);

// Probar la conexión
sequelize.authenticate()
    .then(() => {
        console.log('Conectado a MySQL con Sequelize.');
    })
    .catch((err) => {
        console.error('Error conectando a MySQL con Sequelize:', err);
    });

module.exports = sequelize;