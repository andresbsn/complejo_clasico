const ProductoModel = require('../models/ProductoModel');

const productoController = {
    getAll: async (req, res) => {
        try {
            const filters = {};
            if (req.query.estado) {
                filters.estado = req.query.estado;
            }
            const productos = await ProductoModel.getAll(filters);
            res.json(productos);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener los productos' });
        }
    },

    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const producto = await ProductoModel.getById(id);
            if (!producto) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }
            res.json(producto);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener el producto' });
        }
    },

    create: async (req, res) => {
        try {
            const {
                nombre, categoria, precio, stock,
                stock_minimo, precio_venta, costo,
                proveedor_id, estado
            } = req.body;

            if (!nombre || !precio) {
                return res.status(400).json({ error: 'Nombre y precio son requeridos' });
            }
            const newProducto = await ProductoModel.create({
                nombre, categoria, precio, stock,
                stock_minimo, precio_venta, costo,
                proveedor_id, estado
            });
            res.status(201).json(newProducto);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al crear el producto' });
        }
    },

    update: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                nombre, categoria, precio, stock,
                stock_minimo, precio_venta, costo,
                proveedor_id, estado
            } = req.body;

            const updatedProducto = await ProductoModel.update(id, {
                nombre, categoria, precio, stock,
                stock_minimo, precio_venta, costo,
                proveedor_id, estado
            });

            if (!updatedProducto) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }
            res.json(updatedProducto);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al actualizar el producto' });
        }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const deletedProducto = await ProductoModel.delete(id);
            if (!deletedProducto) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }
            res.json({ message: 'Producto eliminado correctamente', producto: deletedProducto });
        } catch (error) {
            console.error(error);
            // Check if it's a foreign key constraint error
            if (error.code === '23503') {
                return res.status(400).json({
                    error: 'No se puede eliminar el producto porque tiene ventas asociadas'
                });
            }
            res.status(500).json({ error: 'Error al eliminar el producto' });
        }
    }
};

module.exports = productoController;
