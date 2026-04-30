const pool = require('../src/config/db');

const createTables = async () => {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS ventas (
        id SERIAL PRIMARY KEY,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total NUMERIC(10, 2) NOT NULL
      );
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS detalle_ventas (
        id SERIAL PRIMARY KEY,
        venta_id INTEGER REFERENCES ventas(id) ON DELETE CASCADE,
        producto_id INTEGER REFERENCES productos(id),
        cantidad INTEGER NOT NULL,
        precio_unitario NUMERIC(10, 2) NOT NULL
      );
    `);

        console.log('Tablas de ventas creadas exitosamente.');
        process.exit(0);
    } catch (err) {
        console.error('Error al crear tablas:', err);
        process.exit(1);
    }
};

createTables();
