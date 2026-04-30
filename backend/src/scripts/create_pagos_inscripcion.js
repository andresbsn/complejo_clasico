const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const pool = require('../config/db');

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Creating pagos_inscripcion table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS pagos_inscripcion (
                id SERIAL PRIMARY KEY,
                inscripcion_id INTEGER REFERENCES inscripciones(id) ON DELETE CASCADE,
                metodo VARCHAR(50) NOT NULL,
                monto DECIMAL(12, 2) NOT NULL,
                caja_id INTEGER,
                fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('Migrating existing inscription payments to pagos_inscripcion...');
        // Only migrate if there are existing registrations with monto_abonado > 0
        // and they are not already in the payments table
        await client.query(`
            INSERT INTO pagos_inscripcion (inscripcion_id, metodo, monto)
            SELECT id, COALESCE(metodo_pago, 'efectivo'), monto_abonado
            FROM inscripciones
            WHERE id NOT IN (SELECT inscripcion_id FROM pagos_inscripcion)
            AND monto_abonado > 0
        `);

        await client.query('COMMIT');
        console.log('Migration completed successfully');
    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error('Migration failed:', error);
    } finally {
        if (client) client.release();
        process.exit();
    }
}

migrate();
