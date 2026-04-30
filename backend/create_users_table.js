const pool = require('./src/config/db');
const bcrypt = require('bcryptjs');

const createTable = async () => {
    try {
        // await pool.query(`
        //     CREATE TABLE IF NOT EXISTS usuarios (
        //         id SERIAL PRIMARY KEY,
        //         username VARCHAR(50) UNIQUE NOT NULL,
        //         password VARCHAR(255) NOT NULL,
        //         nombre VARCHAR(100) NOT NULL,
        //         rol VARCHAR(20) DEFAULT 'user'
        //     );
        // `);
        // console.log('Tabla usuarios creada');

        const hashedPassword = await bcrypt.hash('cla2026', 10);

        // Check if admin exists
        const res = await pool.query("SELECT * FROM usuarios WHERE username = 'admin'");
        if (res.rows.length === 0) {
            await pool.query(
                'INSERT INTO usuarios (username, password, nombre, rol) VALUES ($1, $2, $3, $4)',
                ['admin', hashedPassword, 'Administrador', 'admin']
            );
            console.log('Usuario admin creado con clave cla2026');
        } else {
            await pool.query(
                'UPDATE usuarios SET password = $1, rol = $2, nombre = $3 WHERE username = $4',
                [hashedPassword, 'admin', 'Administrador', 'admin']
            );
            console.log('Usuario admin actualizado con clave cla2026');
        }

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
};

createTable();
