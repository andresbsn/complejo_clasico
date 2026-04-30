require('dotenv').config({ path: './backend/.env' });
const pool = require('./src/config/db');

const createJugadoresTable = async () => {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS jugadores (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                telefono VARCHAR(50),
                email VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await pool.query(query);
        console.log('Tabla jugadores creada exitosamente.');
    } catch (error) {
        console.error('Error al crear tabla jugadores:', error);
    } finally {
        pool.end();
    }
};

createJugadoresTable();
