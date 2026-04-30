const pool = require('../config/db');

const JugadorModel = {
    async create(data) {
        const { nombre, telefono, email, categoria_id } = data;
        const catId = categoria_id === '' ? null : categoria_id;
        const query = `
            INSERT INTO jugadores (nombre, telefono, email, categoria_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await pool.query(query, [nombre, telefono, email, catId]);
        return result.rows[0];
    },

    async update(id, data) {
        const { nombre, telefono, email, categoria_id } = data;
        const catId = categoria_id === '' ? null : categoria_id;
        const query = `
            UPDATE jugadores 
            SET nombre = $1, telefono = $2, email = $3, categoria_id = $4
            WHERE id = $5
            RETURNING *
        `;
        const result = await pool.query(query, [nombre, telefono, email, catId, id]);
        return result.rows[0];
    },

    async getAll() {
        const query = `
            SELECT j.*, c.descripcion as categoria_descripcion,
            COALESCE(SUM(CASE WHEN m.tipo = 'DEBE' THEN m.monto ELSE -m.monto END), 0) as saldo
            FROM jugadores j
            LEFT JOIN categorias c ON j.categoria_id = c.id
            LEFT JOIN movimientos_cuenta m ON j.id = m.jugador_id
            GROUP BY j.id, c.descripcion
            ORDER BY j.nombre ASC
        `;
        const result = await pool.query(query);
        return result.rows;
    },

    async search(termino) {
        const query = `
            SELECT j.*, c.descripcion as categoria_descripcion 
            FROM jugadores j
            LEFT JOIN categorias c ON j.categoria_id = c.id
            WHERE j.nombre ILIKE $1 
            ORDER BY j.nombre ASC 
            LIMIT 10
        `;
        const result = await pool.query(query, [`%${termino}%`]);
        return result.rows;
    }
};

module.exports = JugadorModel;
