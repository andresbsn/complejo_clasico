const pool = require('../config/db');

const TorneoModel = {
    async create(data) {
        const { descripcion, fecha_inicio, costo_inscripcion } = data;
        const query = `
            INSERT INTO torneos (descripcion, fecha_inicio, costo_inscripcion)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const result = await pool.query(query, [descripcion, fecha_inicio, costo_inscripcion]);
        return result.rows[0];
    },

    async getAll() {
        const query = `
            SELECT t.*, 
                (SELECT COUNT(*) FROM inscripciones i WHERE i.torneo_id = t.id AND (i.estado IS NULL OR i.estado = 'inscripto')) as cantidad_inscriptos,
                (SELECT COUNT(*) FROM inscripciones i WHERE i.torneo_id = t.id AND i.estado = 'baja') as cantidad_abandonos,
                (SELECT COUNT(*) FROM inscripciones i WHERE i.torneo_id = t.id AND (i.pagado = FALSE OR i.pagado IS NULL) AND (i.estado IS NULL OR i.estado = 'inscripto')) as cantidad_impagos,
                (SELECT COUNT(*) FROM inscripciones i WHERE i.torneo_id = t.id AND i.pagado = TRUE AND (i.estado IS NULL OR i.estado = 'inscripto')) as cantidad_pagados
            FROM torneos t 
            ORDER BY t.fecha_inicio DESC
        `;
        const result = await pool.query(query);
        return result.rows;
    },

    async getById(id) {
        const query = 'SELECT * FROM torneos WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }
};

module.exports = TorneoModel;
