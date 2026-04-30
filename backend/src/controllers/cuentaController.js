const CuentaModel = require('../models/CuentaModel');

const cuentaController = {
    getMovimientos: async (req, res) => {
        try {
            const { jugadorId } = req.params;
            const movimientos = await CuentaModel.getByJugador(jugadorId);
            const saldo = await CuentaModel.getSaldo(jugadorId);
            res.json({ movimientos, saldo });
        } catch (error) {
            console.error('Error al obtener movimientos:', error);
            res.status(500).json({ error: 'Error al obtener la cuenta corriente' });
        }
    },

    addMovimiento: async (req, res) => {
        try {
            const { jugador_id, tipo, monto, descripcion, referencia_id, metodo_pago } = req.body;

            if (!jugador_id || !tipo || !monto) {
                return res.status(400).json({ error: 'Faltan datos requeridos' });
            }

            let caja_id = req.caja ? req.caja.id : null;

            const nuevoMovimiento = await CuentaModel.addMovimiento({
                jugador_id,
                tipo,
                monto,
                descripcion,
                referencia_id,
                caja_id,
                metodo_pago
            });

            const nuevoSaldo = await CuentaModel.getSaldo(jugador_id);

            res.status(201).json({ movimiento: nuevoMovimiento, nuevoSaldo });
        } catch (error) {
            console.error('Error al registrar movimiento:', error);
            res.status(500).json({ error: 'Error al registrar movimiento' });
        }
    }
};

module.exports = cuentaController;
