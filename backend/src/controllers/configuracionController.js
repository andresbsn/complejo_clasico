const ConfiguracionModel = require('../models/ConfiguracionModel');

const configuracionController = {
    getAll: async (req, res) => {
        try {
            const configs = await ConfiguracionModel.getAll();
            // Convert array to object for easier frontend usage
            const configObj = configs.reduce((acc, curr) => {
                acc[curr.clave] = curr.valor;
                return acc;
            }, {});
            res.json(configObj);
        } catch (error) {
            console.error('Error al obtener configuración:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    update: async (req, res) => {
        try {
            const { clave } = req.params;
            const { valor } = req.body;
            const updatedConfig = await ConfiguracionModel.update(clave, valor);
            res.json(updatedConfig);
        } catch (error) {
            console.error('Error al actualizar configuración:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
};

module.exports = configuracionController;
