const CategoriaModel = require('../models/CategoriaModel');

const CategoriaController = {
    async getAll(req, res) {
        try {
            const categorias = await CategoriaModel.getAll();
            res.json(categorias);
        } catch (error) {
            console.error('Error al obtener categorias:', error);
            res.status(500).json({ error: 'Error al obtener categorias' });
        }
    }
};

module.exports = CategoriaController;
