require('dotenv').config({ path: __dirname + '/../../.env' });
const pool = require('../config/db');

const runMigration = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Creando tabla compras...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS compras (
                id SERIAL PRIMARY KEY,
                proveedor_id INTEGER REFERENCES proveedores(id),
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                total DECIMAL(10, 2) DEFAULT 0,
                estado VARCHAR(20) DEFAULT 'PENDIENTE',
                observaciones TEXT
            );
        `);

        console.log('Creando tabla detalle_compra...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS detalle_compra (
                id SERIAL PRIMARY KEY,
                compra_id INTEGER REFERENCES compras(id) ON DELETE CASCADE,
                producto_id INTEGER REFERENCES productos(id),
                cantidad INTEGER NOT NULL,
                costo_unitario DECIMAL(10, 2) NOT NULL,
                subtotal DECIMAL(10, 2) NOT NULL
            );
        `);

        await client.query('COMMIT');
        console.log('Migración de compras completada exitosamente.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error durante la migración:', error);
    } finally {
        client.release();
        process.exit();
    }
};

runMigration();
