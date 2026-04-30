const pool = require('../config/db');

const CanchaModel = {
    // Obtener todas las canchas
    async getAll() {
        const query = 'SELECT * FROM canchas ORDER BY id ASC';
        const result = await pool.query(query);
        return result.rows;
    },

    // Obtener canchas por tipo
    async getByType(tipo) {
        const query = 'SELECT * FROM canchas WHERE tipo = $1 ORDER BY id ASC';
        const result = await pool.query(query, [tipo]);
        return result.rows;
    },

    // Obtener una cancha por ID
    async getById(id) {
        const query = 'SELECT * FROM canchas WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    },

    // Crear una nueva cancha
    async create(data) {
        const { nombre, tipo } = data;
        const query = `
            INSERT INTO canchas (nombre, tipo)
            VALUES ($1, $2)
            RETURNING *
        `;
        const result = await pool.query(query, [nombre, tipo]);
        return result.rows[0];
    },

    // Actualizar una cancha
    async update(id, data) {
        const { nombre, tipo } = data;
        const query = `
            UPDATE canchas
            SET nombre = $1, tipo = $2
            WHERE id = $3
            RETURNING *
        `;
        const result = await pool.query(query, [nombre, tipo, id]);
        return result.rows[0];
    },

    // Eliminar una cancha
    async delete(id) {
        const query = 'DELETE FROM canchas WHERE id = $1 RETURNING *';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }
};

module.exports = CanchaModel;
