const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'postgres_35702',
    port: 5432,
});

const updateSchema = async () => {
    try {
        console.log('Starting Schema Update with Hardcoded Creds...');

        // Ensure schema
        await pool.query('CREATE SCHEMA IF NOT EXISTS clasico_bd');
        await pool.query('SET search_path TO clasico_bd');

        // 1. Create Proveedores Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS proveedores (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                contacto VARCHAR(100),
                telefono VARCHAR(50),
                email VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Table proveedores created/verified.');

        // 2. Add columns to Productos Table
        // We use a block to handle potential errors if columns exist, or check first.
        // Simplified approach: Add columns if they don't exist.

        const alterQueries = [
            `ALTER TABLE productos ADD COLUMN IF NOT EXISTS stock_minimo INTEGER DEFAULT 0;`,
            `ALTER TABLE productos ADD COLUMN IF NOT EXISTS precio_venta DECIMAL(10, 2);`,
            `ALTER TABLE productos ADD COLUMN IF NOT EXISTS costo DECIMAL(10, 2);`,
            `ALTER TABLE productos ADD COLUMN IF NOT EXISTS proveedor_id INTEGER REFERENCES proveedores(id) ON DELETE SET NULL;`,
            `ALTER TABLE productos ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'ACTIVO';`,
            `ALTER TABLE productos ADD COLUMN IF NOT EXISTS codigo_barra VARCHAR(100);`
        ];

        for (const query of alterQueries) {
            await pool.query(query);
        }

        // If 'precio' existed, we might want to migrate it to 'precio_venta' if that's the intention, 
        // or just keep using 'precio' as sale price.
        // The user asked for "precio de venta". existing is "precio". 
        // I'll keep "precio" as the main one for compatibility or update usage later. 
        // Let's assume 'precio' IS 'precio_venta' for now to avoid breaking existing code immediately, 
        // but I added 'precio_venta' explicitly as requested. 
        // I will copy values from precio to precio_venta just in case.

        await pool.query(`UPDATE productos SET precio_venta = precio WHERE precio_venta IS NULL;`);

        console.log('Table productos altered successfully.');

    } catch (error) {
        console.error('Error updating schema:', error);
    } finally {
        pool.end();
    }
};

updateSchema();
