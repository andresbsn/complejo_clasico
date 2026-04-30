const pool = require('../config/db');

const GastoModel = {
    async create(data) {
        const { descripcion, monto, caja_id, usuario_id } = data;
        const query = `
            INSERT INTO gastos (descripcion, monto, caja_id, usuario_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const res = await pool.query(query, [descripcion, monto, caja_id, usuario_id]);
        return res.rows[0];
    },

    async getAll() {
        // Order by fecha descending by default
        const query = `
            SELECT g.*, u.nombre as usuario_nombre 
            FROM gastos g
            LEFT JOIN usuarios u ON g.usuario_id = u.id
            ORDER BY g.fecha DESC
        `;
        const res = await pool.query(query);
        return res.rows;
    },

    async delete(id) {
        const query = 'DELETE FROM gastos WHERE id = $1 RETURNING *';
        const res = await pool.query(query, [id]);
        return res.rows[0];
    }
};

module.exports = GastoModel;
