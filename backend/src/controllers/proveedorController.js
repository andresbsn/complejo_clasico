const ProveedorModel = require('../models/ProveedorModel');

const proveedorController = {
    getAll: async (req, res) => {
        try {
            const proveedores = await ProveedorModel.getAll();
            res.json(proveedores);
        } catch (error) {
            console.error('Error getting proveedores:', error);
            res.status(500).json({ error: 'Error al obtener proveedores' });
        }
    },

    create: async (req, res) => {
        try {
            const proveedor = await ProveedorModel.create(req.body);
            res.status(201).json(proveedor);
        } catch (error) {
            console.error('Error creating proveedor:', error);
            res.status(500).json({ error: 'Error al crear proveedor' });
        }
    },

    update: async (req, res) => {
        try {
            const proveedor = await ProveedorModel.update(req.params.id, req.body);
            if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado' });
            res.json(proveedor);
        } catch (error) {
            console.error('Error updating proveedor:', error);
            res.status(500).json({ error: 'Error al actualizar proveedor' });
        }
    },

    delete: async (req, res) => {
        try {
            const proveedor = await ProveedorModel.delete(req.params.id);
            if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado' });
            res.json(proveedor);
        } catch (error) {
            console.error('Error deleting proveedor:', error);
            res.status(500).json({ error: 'Error al eliminar proveedor' });
        }
    },

    getCuenta: async (req, res) => {
        try {
            const movimientos = await ProveedorModel.getMovimientos(req.params.id);
            res.json(movimientos);
        } catch (error) {
            console.error('Error getting movimientos:', error);
            res.status(500).json({ error: 'Error al obtener movimientos' });
        }
    },

    addMovimiento: async (req, res) => {
        try {
            const movimiento = await ProveedorModel.addMovimiento(req.body);
            res.status(201).json(movimiento);
        } catch (error) {
            console.error('Error adding movimiento:', error);
            res.status(500).json({ error: 'Error al registrar movimiento' });
        }
    }
};

module.exports = proveedorController;
