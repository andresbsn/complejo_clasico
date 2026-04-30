const CanchaModel = require('../models/CanchaModel');

const canchaController = {
    getAll: async (req, res) => {
        try {
            const { type } = req.query;
            let canchas;
            if (type) {
                canchas = await CanchaModel.getByType(type);
            } else {
                canchas = await CanchaModel.getAll();
            }
            res.json(canchas);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener las canchas' });
        }
    },

    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const cancha = await CanchaModel.getById(id);
            if (!cancha) {
                return res.status(404).json({ error: 'Cancha no encontrada' });
            }
            res.json(cancha);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener la cancha' });
        }
    },

    create: async (req, res) => {
        try {
            const { nombre, tipo } = req.body;
            if (!nombre || !tipo) {
                return res.status(400).json({ error: 'Nombre y tipo son requeridos' });
            }
            const newCancha = await CanchaModel.create({ nombre, tipo });
            res.status(201).json(newCancha);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al crear la cancha' });
        }
    },

    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { nombre, tipo } = req.body;
            const updatedCancha = await CanchaModel.update(id, { nombre, tipo });
            if (!updatedCancha) {
                return res.status(404).json({ error: 'Cancha no encontrada' });
            }
            res.json(updatedCancha);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al actualizar la cancha' });
        }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const deletedCancha = await CanchaModel.delete(id);
            if (!deletedCancha) {
                return res.status(404).json({ error: 'Cancha no encontrada' });
            }
            res.json({ message: 'Cancha eliminada correctamente', cancha: deletedCancha });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al eliminar la cancha' });
        }
    }
};

module.exports = canchaController;
