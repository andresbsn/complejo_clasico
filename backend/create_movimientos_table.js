const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const createMovimientosTable = async () => {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS movimientos_cuenta (
                id SERIAL PRIMARY KEY,
                jugador_id INTEGER REFERENCES jugadores(id) ON DELETE CASCADE,
                tipo VARCHAR(10) CHECK (tipo IN ('DEBE', 'HABER')) NOT NULL,
                monto DECIMAL(10, 2) NOT NULL,
                descripcion TEXT,
                referencia_id INTEGER,
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await pool.query(query);
        console.log('Tabla movimientos_cuenta creada exitosamente.');
    } catch (error) {
        console.error('Error al crear tabla movimientos_cuenta:', error);
    } finally {
        pool.end();
    }
};

createMovimientosTable();
