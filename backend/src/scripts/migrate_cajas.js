require('dotenv').config({ path: __dirname + '/../../.env' });
const pool = require('../config/db');

const runMigration = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Creando tabla cajas...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS cajas (
                id SERIAL PRIMARY KEY,
                fecha_apertura TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                fecha_cierre TIMESTAMP,
                saldo_inicial DECIMAL(10, 2) DEFAULT 0,
                saldo_final DECIMAL(10, 2),
                estado VARCHAR(20) DEFAULT 'abierta',
                usuario_apertura_id INTEGER REFERENCES usuarios(id),
                usuario_cierre_id INTEGER REFERENCES usuarios(id),
                observaciones TEXT
            );
        `);

        console.log('Agregando columna caja_id a ventas_cantina...');
        await client.query(`
            ALTER TABLE ventas_cantina 
            ADD COLUMN IF NOT EXISTS caja_id INTEGER REFERENCES cajas(id);
        `);

        console.log('Agregando columna caja_id a pagos...');
        await client.query(`
            ALTER TABLE pagos 
            ADD COLUMN IF NOT EXISTS caja_id INTEGER REFERENCES cajas(id);
        `);

        console.log('Agregando columna caja_id a inscripciones...');
        await client.query(`
            ALTER TABLE inscripciones 
            ADD COLUMN IF NOT EXISTS caja_id INTEGER REFERENCES cajas(id);
        `);

        console.log('Agregando columna caja_id a movimientos_cuenta...');
        await client.query(`
            ALTER TABLE movimientos_cuenta 
            ADD COLUMN IF NOT EXISTS caja_id INTEGER REFERENCES cajas(id);
        `);

        await client.query('COMMIT');
        console.log('Migración completada exitosamente.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error durante la migración:', error);
    } finally {
        client.release();
        // Force exit because pool keeps connection alive
        process.exit();
    }
};

runMigration();
