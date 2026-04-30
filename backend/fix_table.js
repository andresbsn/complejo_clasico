require('dotenv').config();
const pool = require('./src/config/db');

const checkAndCreateTable = async () => {
    try {
        // Check if table exists
        const checkQuery = `
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'reservas_fijas'
            );
        `;
        const res = await pool.query(checkQuery);
        const exists = res.rows[0].exists;

        if (!exists) {
            console.log('Table reservas_fijas does not exist. Creating...');
            const createTableQuery = `
                CREATE TABLE reservas_fijas (
                    id SERIAL PRIMARY KEY,
                    cancha_id INT NOT NULL REFERENCES canchas(id),
                    dia_semana INT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
                    hora_inicio TIME NOT NULL,
                    hora_fin TIME NOT NULL,
                    cliente_nombre VARCHAR(100) NOT NULL,
                    cliente_telefono VARCHAR(50),
                    monto_total DECIMAL(10, 2) DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `;
            await pool.query(createTableQuery);
            console.log('Table reservas_fijas created successfully.');
        } else {
            console.log('Table reservas_fijas already exists.');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
};

checkAndCreateTable();
