const pool = require('../config/db');

const ConfiguracionModel = {
    async getAll() {
        const result = await pool.query('SELECT * FROM configuracion');
        return result.rows;
    },

    async update(clave, valor) {
        const query = `
            INSERT INTO configuracion (clave, valor)
            VALUES ($1, $2)
            ON CONFLICT (clave) 
            DO UPDATE SET valor = EXCLUDED.valor
            RETURNING *
        `;
        const result = await pool.query(query, [clave, valor]); // Note: Reversed generic param order to match query
        return result.rows[0];
    },

    async getByClave(clave) {
        const result = await pool.query('SELECT * FROM configuracion WHERE clave = $1', [clave]);
        return result.rows[0];
    }
};

module.exports = ConfiguracionModel;
