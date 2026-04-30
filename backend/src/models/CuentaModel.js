const pool = require('../config/db');

const CuentaModel = {
    // Obtener historial de movimientos de un jugador
    async getByJugador(jugadorId) {
        const query = `
            SELECT * FROM movimientos_cuenta 
            WHERE jugador_id = $1 
            ORDER BY fecha DESC
        `;
        const result = await pool.query(query, [jugadorId]);
        return result.rows;
    },

    async addMovimiento(movimiento, client = null) {
        const { jugador_id, tipo, monto, descripcion, referencia_id, caja_id, metodo_pago } = movimiento;
        const query = `
            INSERT INTO movimientos_cuenta (jugador_id, tipo, monto, descripcion, referencia_id, caja_id, metodo_pago)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const db = client || pool;
        const result = await db.query(query, [jugador_id, tipo, monto, descripcion, referencia_id, caja_id, metodo_pago]);
        return result.rows[0];
    },

    // Obtener saldo actual de un jugador
    async getSaldo(jugadorId) {
        const query = `
            SELECT 
                COALESCE(SUM(CASE WHEN tipo = 'DEBE' THEN monto ELSE -monto END), 0) as saldo
            FROM movimientos_cuenta
            WHERE jugador_id = $1
        `;
        const result = await pool.query(query, [jugadorId]);
        return parseFloat(result.rows[0].saldo) || 0;
    }
};

module.exports = CuentaModel;
