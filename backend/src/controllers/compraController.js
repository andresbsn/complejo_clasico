const CompraModel = require('../models/CompraModel');

const CompraController = {
    getAll: async (req, res) => {
        try {
            const compras = await CompraModel.getAll();
            res.json(compras);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener compras' });
        }
    },

    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const compra = await CompraModel.getById(id);
            if (!compra) return res.status(404).json({ error: 'Compra no encontrada' });
            res.json(compra);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener compra' });
        }
    },

    create: async (req, res) => {
        try {
            const compra = await CompraModel.create(req.body);
            res.status(201).json(compra);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al crear compra' });
        }
    },

    update: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await CompraModel.update(id, req.body);
            res.json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    },

    confirmar: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await CompraModel.confirmarStock(id);
            res.json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await CompraModel.delete(id);
            res.json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = CompraController;
