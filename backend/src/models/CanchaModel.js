const pool = require('../config/db');

const CanchaModel = {
    // Obtener todas las canchas
    async getAll(complejo = null) {
        const values = [];
        let query = 'SELECT * FROM canchas';

        if (complejo) {
            query += ' WHERE complejo = $1';
            values.push(complejo);
        }

        query += ' ORDER BY id ASC';
        const result = await pool.query(query, values);
        return result.rows;
    },

    // Obtener canchas por tipo
    async getByType(tipo, complejo = null) {
        const values = [tipo];
        let query = 'SELECT * FROM canchas WHERE tipo = $1';

        if (complejo) {
            query += ' AND complejo = $2';
            values.push(complejo);
        }

        query += ' ORDER BY id ASC';
        const result = await pool.query(query, values);
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
        const { nombre, tipo, complejo = 'Clasico 1' } = data;
        const query = `
            INSERT INTO canchas (nombre, tipo, complejo)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const result = await pool.query(query, [nombre, tipo, complejo]);
        return result.rows[0];
    },

    // Actualizar una cancha
    async update(id, data) {
        const { nombre, tipo, complejo = null } = data;
        const query = `
            UPDATE canchas
            SET nombre = $1, tipo = $2, complejo = COALESCE($3, complejo)
            WHERE id = $4
            RETURNING *
        `;
        const result = await pool.query(query, [nombre, tipo, complejo, id]);
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
