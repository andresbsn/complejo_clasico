const pool = require('../config/db');

const PagoModel = {
    async create(pagoData) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 0. Obtener caja abierta
            const cajaRes = await client.query("SELECT id FROM cajas WHERE estado = 'abierta' LIMIT 1");
            const cajaId = cajaRes.rows.length > 0 ? cajaRes.rows[0].id : null;

            const { turno_id, monto, metodo, observaciones, jugador_id } = pagoData;

            // Si es cuenta corriente, registrar deuda en movimientos_cuenta
            if (metodo === 'cuenta_corriente' && jugador_id) {
                const deudaQuery = `
                    INSERT INTO movimientos_cuenta (jugador_id, tipo, monto, descripcion, referencia_id, caja_id)
                    VALUES ($1, 'DEBE', $2, $3, $4, $5)
                `;
                // Referencia temporal al turno mientras creamos el pago
                const descripcionDeuda = `Pago Turno #${turno_id} ${observaciones ? `(${observaciones})` : ''}`;
                await client.query(deudaQuery, [jugador_id, monto, descripcionDeuda, turno_id, cajaId]);
            }

            // 1. Registrar el pago
            const pagoQuery = `
                INSERT INTO pagos (turno_id, monto, metodo, caja_id, observaciones, jugador_id)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `;
            // Check if pagos table has jugador_id column. It might not.
            // If it doesn't, we can't insert it. 
            // The original list_file didn't show schema but let's assume we might need to add it or ignore it for now.
            // The user request said "assign a player". If we record it in 'movimientos_cuenta', that's where the assignment lives for the debt.
            // The 'pagos' table records the payment of the turn. 
            // If I try to insert 'jugador_id' into 'pagos' and the column doesn't exist, it will crash.
            // I should verify if 'pagos' has 'jugador_id'.
            // Given I cannot verify schema easily without checking migration or error, I will play safe.
            // I will NOT insert 'jugador_id' into 'pagos' unless I'm sure.
            // BUT, the 'movimientos_cuenta' tracks the debt.
            // Is it sufficient? Yes. The payment is linked to the Turno. The debt is linked to the Jugador.
            // I will stick to inserting into 'pagos' WITHOUT 'jugador_id' unless I see a migration file.

            const pagoResult = await client.query(`
                INSERT INTO pagos (turno_id, monto, metodo, caja_id, observaciones)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `, [turno_id, monto, metodo, cajaId, observaciones]);

            const pago = pagoResult.rows[0];

            // 2. Actualizar estado del turno si es necesario
            // Primero obtenemos el turno para saber el total
            const turnoQuery = `
                SELECT t.monto_total, c.tipo as cancha_tipo 
                FROM turnos t
                JOIN canchas c ON t.cancha_id = c.id
                WHERE t.id = $1
            `;
            const turnoResult = await client.query(turnoQuery, [turno_id]);
            const turno = turnoResult.rows[0];

            // Calcular total pagado para este turno
            const totalPagadoQuery = 'SELECT SUM(monto) as total FROM pagos WHERE turno_id = $1';
            const totalPagadoResult = await client.query(totalPagadoQuery, [turno_id]);
            const totalPagado = parseFloat(totalPagadoResult.rows[0].total || 0);

            if (totalPagado >= parseFloat(turno.monto_total)) {
                await client.query('UPDATE turnos SET pagado = TRUE WHERE id = $1', [turno_id]);
            }

            await client.query('COMMIT');
            return pago;
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    },

    async getByTurno(turnoId) {
        const query = 'SELECT * FROM pagos WHERE turno_id = $1 ORDER BY fecha_pago DESC';
        const result = await pool.query(query, [turnoId]);
        return result.rows;
    }
};

module.exports = PagoModel;
