const pool = require('../config/db');

const InscripcionModel = {
    async create(data) {
        const { torneo_id, jugador_id } = data;
        const query = `
            INSERT INTO inscripciones (torneo_id, jugador_id)
            VALUES ($1, $2)
            RETURNING *
        `;
        const result = await pool.query(query, [torneo_id, jugador_id]);
        return result.rows[0];
    },

    async getByTorneo(torneoId) {
        const query = `
            SELECT i.*, j.nombre as jugador_nombre, c.descripcion as jugador_categoria
            FROM inscripciones i
            JOIN jugadores j ON i.jugador_id = j.id
            LEFT JOIN categorias c ON j.categoria_id = c.id
            WHERE i.torneo_id = $1
            ORDER BY j.nombre ASC
        `;
        const result = await pool.query(query, [torneoId]);
        return result.rows;
    },

    async registrarPago(id, pagos) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const cajaRes = await client.query("SELECT id FROM cajas WHERE estado = 'abierta' LIMIT 1");
            const cajaId = cajaRes.rows.length > 0 ? cajaRes.rows[0].id : null;

            const payments = Array.isArray(pagos) ? pagos : [pagos];
            let totalRecibido = 0;
            let ultimoMetodo = '';

            for (const p of payments) {
                const monto = parseFloat(p.monto);
                const metodo = p.metodo;
                totalRecibido += monto;
                ultimoMetodo = metodo;

                await client.query(`
                    INSERT INTO pagos_inscripcion (inscripcion_id, monto, metodo, caja_id)
                    VALUES ($1, $2, $3, $4)
                `, [id, monto, metodo, cajaId]);

                if (metodo === 'cuenta_corriente') {
                    const { jugador_id, torneo_id } = p; // Ensure these are passed
                    const CuentaModel = require('./CuentaModel');
                    await CuentaModel.addMovimiento({
                        jugador_id: jugador_id,
                        tipo: 'DEBE',
                        monto: monto,
                        descripcion: `Inscripción Torneo #${torneo_id || ''}`,
                        referencia_id: id,
                        caja_id: cajaId
                    }, client); // Pass client for transaction context if CuentaModel supports it
                }
            }

            const queryUpdate = `
                UPDATE inscripciones i
                SET 
                    monto_abonado = COALESCE(i.monto_abonado, 0) + $2,
                    fecha_pago = CURRENT_TIMESTAMP,
                    metodo_pago = $3,
                    pagado = (COALESCE(i.monto_abonado, 0) + $2) >= (SELECT costo_inscripcion FROM torneos t WHERE t.id = i.torneo_id)
                WHERE i.id = $1
                RETURNING *
            `;
            const result = await client.query(queryUpdate, [id, totalRecibido, payments.length > 1 ? 'Múltiple' : ultimoMetodo]);

            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    async cambiarEstado(id, estado) {
        const query = 'UPDATE inscripciones SET estado = $2 WHERE id = $1 RETURNING *';
        const result = await pool.query(query, [id, estado]);
        return result.rows[0];
    }
};

module.exports = InscripcionModel;
