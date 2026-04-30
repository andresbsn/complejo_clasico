require('dotenv').config({ path: './backend/.env' });
const pool = require('./src/config/db');

const createTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS configuracion (
                clave VARCHAR(50) PRIMARY KEY,
                valor VARCHAR(255) NOT NULL
            );
        `);
        console.log('Tabla configuracion creada');

        // Seed data
        await pool.query(`
            INSERT INTO configuracion (clave, valor) VALUES 
            ('PRECIO_PADEL', '2000'),
            ('PRECIO_FUTBOL', '3000'),
            ('DURACION_PADEL', '90'),
            ('DURACION_FUTBOL', '60'),
            ('HORARIO_APERTURA', '14:00'),
            ('HORARIO_CIERRE', '24:00')
            ON CONFLICT (clave) DO NOTHING;
        `);
        console.log('Datos de configuración insertados');
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
};

createTable();
