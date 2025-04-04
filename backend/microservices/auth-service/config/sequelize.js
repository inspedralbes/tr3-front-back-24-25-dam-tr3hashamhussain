const { Sequelize } = require('sequelize');

// Configuración mejorada con manejo de errores
const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASSWORD,
  {
    host: process.env.MYSQL_HOST,
    dialect: 'mysql',
    port: 3306, // Puerto explícito
    logging: console.log, // Para ver los logs de SQL
    retry: { // Configuración de reintentos
      max: 5,
      timeout: 60000
    },
    dialectOptions: {
      connectTimeout: 60000
    }
  }
);

// Función para probar la conexión
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a MySQL establecida correctamente.');
    
    // Verificar si la base de datos existe, si no, crearla
    await sequelize.query(`CREATE DATABASE IF NOT EXISTS ${process.env.MYSQL_DATABASE};`);
    console.log(`Base de datos "${process.env.MYSQL_DATABASE}" verificada.`);
    
  } catch (error) {
    console.error('Error de conexión a MySQL:', error);
    process.exit(1); // Salir con error
  }
}

testConnection();

module.exports = sequelize;