const path = require('path');
const { Pool } = require('pg');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Configuración de la conexión a PostgreSQL
// Se recomienda usar variables de entorno en producción
const getEnv = (key, fallback) => {
  const value = process.env[key];
  return typeof value === 'string' ? value.trim() : fallback;
};

const poolConfig = {
  user: getEnv('DB_USER', 'postgres'),
  host: getEnv('DB_HOST', 'localhost'),
  database: getEnv('DB_NAME', 'clasico_bd'),
  password: getEnv('DB_PASSWORD', 'password'),
  port: Number(getEnv('DB_PORT', 5432)),
};

if (process.env.DB_SCHEMA) {
  poolConfig.options = `-c search_path=${process.env.DB_SCHEMA.trim()}`;
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Error inesperado en el cliente de PostgreSQL', err);
  process.exit(-1);
});

module.exports = pool;
