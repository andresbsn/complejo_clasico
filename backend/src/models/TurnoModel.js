const pool = require('../config/db');

const TurnoModel = {
    // Crear un nuevo turno
    async create(data) {
        const { cancha_id, fecha, hora_inicio, hora_fin, cliente_nombre, cliente_telefono, monto_total, estado = 'confirmado' } = data;

        // Solo validar superposición si NO es un turno cancelado
        // Los turnos cancelados no ocupan el slot realmente
        if (estado !== 'cancelado') {
            const overlapQuery = `
                SELECT id FROM turnos 
                WHERE cancha_id = $1 
                AND fecha = $2 
                AND estado != 'cancelado'
                AND (
                    (hora_inicio < $4 AND hora_fin > $3)
                )
            `;
            const overlapResult = await pool.query(overlapQuery, [cancha_id, fecha, hora_inicio, hora_fin]);

            if (overlapResult.rows.length > 0) {
                throw new Error('El turno se superpone con otro existente.');
            }
        }

        const query = `
      INSERT INTO turnos (cancha_id, fecha, hora_inicio, hora_fin, cliente_nombre, cliente_telefono, monto_total, estado)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
        const values = [cancha_id, fecha, hora_inicio, hora_fin, cliente_nombre, cliente_telefono, monto_total, estado];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    // Crear reserva fija
    async createFijo(data) {
        const { cancha_id, dia_semana, hora_inicio, hora_fin, cliente_nombre, cliente_telefono, monto_total } = data;

        const query = `
            INSERT INTO reservas_fijas (cancha_id, dia_semana, hora_inicio, hora_fin, cliente_nombre, cliente_telefono, monto_total)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const values = [cancha_id, dia_semana, hora_inicio, hora_fin, cliente_nombre, cliente_telefono, monto_total];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    // Obtener turnos por fecha y opcionalmente por cancha
    async getByDate(fecha, cancha_id = null) {
        // 1. Obtener turnos reales
        let query = `
      SELECT t.*, c.nombre as cancha_nombre, c.tipo as cancha_tipo,
      COALESCE((SELECT SUM(monto) FROM pagos WHERE turno_id = t.id), 0) as monto_pagado
      FROM turnos t
      JOIN canchas c ON t.cancha_id = c.id
      WHERE t.fecha = $1
    `;
        const values = [fecha];

        if (cancha_id) {
            query += ` AND t.cancha_id = $2`;
            values.push(cancha_id);
        }

        query += ` ORDER BY t.hora_inicio ASC`;

        const result = await pool.query(query, values);
        const turnosReales = result.rows;

        // 2. Obtener reservas fijas para el día de la semana
        const dateObj = new Date(fecha);
        // Ajustar fecha para evitar problemas de zona horaria al obtener el día
        // Asumimos que fecha es YYYY-MM-DD. Agregamos T12:00:00 para asegurar el día correcto localmente
        const diaSemana = new Date(fecha + 'T12:00:00').getDay();

        let queryFijos = `
            SELECT rf.*, c.nombre as cancha_nombre, c.tipo as cancha_tipo,
            0 as monto_pagado
            FROM reservas_fijas rf
            JOIN canchas c ON rf.cancha_id = c.id
            WHERE rf.dia_semana = $1
        `;
        const valuesFijos = [diaSemana];
        if (cancha_id) {
            queryFijos += ` AND rf.cancha_id = $2`;
            valuesFijos.push(cancha_id);
        }

        const resultFijos = await pool.query(queryFijos, valuesFijos);
        const turnosFijos = resultFijos.rows;

        // 3. Fusionar: Los turnos reales tienen prioridad
        const turnosFinales = [...turnosReales];

        turnosFijos.forEach(fijo => {
            // Verificar si ya existe un turno real que solape (incluyendo cancelados)
            const existeReal = turnosReales.some(real =>
                real.cancha_id === fijo.cancha_id &&
                real.hora_inicio.slice(0, 5) === fijo.hora_inicio.slice(0, 5)
            );

            // Solo agregar el turno fijo si NO existe ningún turno real (ni siquiera cancelado)
            if (!existeReal) {
                turnosFinales.push({
                    ...fijo,
                    id: `fijo_${fijo.id}`, // ID virtual para el frontend
                    fecha: fecha,
                    estado: 'fijo',
                    es_fijo: true
                });
            }
        });

        // Ordenar por hora
        turnosFinales.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

        return turnosFinales;
    },

    // Actualizar estado de un turno
    async updateStatus(id, estado) {
        const query = `
      UPDATE turnos SET estado = $1 WHERE id = $2 RETURNING *
    `;
        const result = await pool.query(query, [estado, id]);
        return result.rows[0];
    },

    // Eliminar turno fijo permanentemente
    async deleteFijo(id) {
        const query = 'DELETE FROM reservas_fijas WHERE id = $1 RETURNING *';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }
};

module.exports = TurnoModel;
