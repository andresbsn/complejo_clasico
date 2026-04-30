const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'postgres_35702',
    port: 5432,
});

const createMovimientosProveedorTable = async () => {
    try {
        console.log('Connecting to database...');
        await pool.query('SET search_path TO clasico_bd');

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS movimientos_proveedor (
                id SERIAL PRIMARY KEY,
                proveedor_id INTEGER REFERENCES proveedores(id) ON DELETE CASCADE,
                tipo VARCHAR(10) CHECK (tipo IN ('DEBE', 'HABER')) NOT NULL,
                monto DECIMAL(10, 2) NOT NULL,
                descripcion TEXT,
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        await pool.query(createTableQuery);
        console.log("Table 'movimientos_proveedor' created successfully.");
    } catch (err) {
        console.error('Error creating table:', err);
    } finally {
        await pool.end();
    }
};

createMovimientosProveedorTable();
