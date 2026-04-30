require('dotenv').config({ path: __dirname + '/../../.env' });
const pool = require('../config/db');

const runMigration = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Creando tabla gastos...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS gastos (
                id SERIAL PRIMARY KEY,
                descripcion TEXT NOT NULL,
                monto DECIMAL(10, 2) NOT NULL,
                fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                caja_id INTEGER REFERENCES cajas(id),
                usuario_id INTEGER REFERENCES usuarios(id)
            );
        `);

        await client.query('COMMIT');
        console.log('Migración de gastos completada exitosamente.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error durante la migración:', error);
    } finally {
        client.release();
        process.exit();
    }
};

runMigration();
