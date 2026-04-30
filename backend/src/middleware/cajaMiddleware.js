const CajaModel = require('../models/CajaModel');

const checkCajaAbierta = async (req, res, next) => {
    try {
        const caja = await CajaModel.getAbierta();
        if (!caja) {
            return res.status(403).json({
                error: 'Caja cerrada',
                message: 'No se puede realizar esta operación porque la caja está cerrada. Por favor, abra la caja primero.',
                redirectTo: '/caja'
            });
        }
        req.caja = caja; // Optional: add the open caja to request for further use
        next();
    } catch (error) {
        console.error('Error in checkCajaAbierta middleware:', error);
        res.status(500).json({ error: 'Error del servidor al verificar el estado de la caja' });
    }
};

module.exports = { checkCajaAbierta };
