const GastoModel = require('../models/GastoModel');
const CajaModel = require('../models/CajaModel');

const GastoController = {
    create: async (req, res) => {
        try {
            const { descripcion, monto } = req.body;
            // Get open caja
            const cajaAbierta = await CajaModel.getAbierta();
            if (!cajaAbierta) {
                return res.status(400).json({ error: 'No hay una caja abierta para registrar el gasto.' });
            }

            const gasto = await GastoModel.create({
                descripcion,
                monto,
                caja_id: cajaAbierta.id,
                usuario_id: req.user ? req.user.id : null // Assuming auth middleware populates req.user
            });

            res.status(201).json(gasto);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al registrar gasto' });
        }
    },

    getAll: async (req, res) => {
        try {
            const gastos = await GastoModel.getAll();
            res.json(gastos);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener gastos' });
        }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const deleted = await GastoModel.delete(id);
            if (!deleted) return res.status(404).json({ error: 'Gasto no encontrado' });
            res.json(deleted);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al eliminar gasto' });
        }
    }
};

module.exports = GastoController;
