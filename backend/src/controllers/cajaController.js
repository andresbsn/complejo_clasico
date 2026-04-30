const CajaModel = require('../models/CajaModel');

const CajaController = {
    abrir: async (req, res) => {
        try {
            const { saldo_inicial, usuario_id } = req.body;
            // Validar
            if (saldo_inicial === undefined) return res.status(400).json({ error: 'Saldo inicial requerido' });

            // usuario_id might come from auth middleware usually (`req.user.id`), but user didn't specify strict auth.
            // Assuming req.body for now or req.user if available.
            const userId = req.user ? req.user.id : (usuario_id || null);

            const caja = await CajaModel.abrir(userId, saldo_inicial);
            res.status(201).json(caja);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    },

    cerrar: async (req, res) => {
        try {
            const { id } = req.params;
            const { saldo_final, usuario_id } = req.body;
            const userId = req.user ? req.user.id : (usuario_id || null);

            const caja = await CajaModel.cerrar(id, saldo_final, userId);
            res.json(caja);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    },

    getEstado: async (req, res) => {
        try {
            const caja = await CajaModel.getAbierta();
            if (!caja) {
                // Return null or 404? Front might expect 200 with null
                return res.json(null);
            }
            res.json(caja);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener estado de caja' });
        }
    },

    getMovimientos: async (req, res) => {
        try {
            const { id } = req.params;
            const movimientos = await CajaModel.getMovimientos(id);
            res.json(movimientos);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener movimientos' });
        }
    },

    getHistorial: async (req, res) => {
        try {
            const cajas = await CajaModel.getTodas();
            res.json(cajas);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener historial' });
        }
    },

    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const caja = await CajaModel.getById(id);
            if (!caja) return res.status(404).json({ error: 'Caja no encontrada' });

            // Optionally fetch movements too? Or separate call?
            // User: "cuando busque la caja de tal dia me va a traer todos los movimientos"
            // Let's provide an option or just another endpoint for full details
            res.json(caja);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener caja' });
        }
    }
};

module.exports = CajaController;
