
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const pool = require('../config/db');

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Creating pagos_ventas table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS pagos_ventas (
                id SERIAL PRIMARY KEY,
                venta_id INTEGER REFERENCES ventas_cantina(id) ON DELETE CASCADE,
                metodo VARCHAR(50) NOT NULL,
                monto DECIMAL(12, 2) NOT NULL,
                referencia VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Check if there are existing sales without payments and migrate them
        // This is tricky because we might double count if we run this multiple times without checks.
        // Let's just ensure the table exists.
        // Determining which sales need migration: those not in pagos_ventas.

        console.log('Migrating existing sales to payments...');
        await client.query(`
            INSERT INTO pagos_ventas (venta_id, metodo, monto)
            SELECT id, metodo_pago, total
            FROM ventas_cantina
            WHERE id NOT IN (SELECT venta_id FROM pagos_ventas)
            AND metodo_pago IS NOT NULL
        `);

        await client.query('COMMIT');
        console.log('Migration completed successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
