const pool = require('./src/config/db');

const createTableQuery = `
CREATE TABLE IF NOT EXISTS reservas_fijas (
    id SERIAL PRIMARY KEY,
    cancha_id INT NOT NULL REFERENCES canchas(id),
    dia_semana INT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Domingo, 1=Lunes, ...
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    cliente_nombre VARCHAR(100) NOT NULL,
    cliente_telefono VARCHAR(50),
    monto_total DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

(async () => {
    try {
        await pool.query(createTableQuery);
        console.log('Table reservas_fijas created successfully');
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
})();
