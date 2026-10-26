const VentaModel = require('../models/VentaModel');

const getTodayInArgentina = () => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
}).format(new Date());

const ventaController = {
    createVenta: async (req, res) => {
        try {
            const venta = await VentaModel.create({
                ...req.body,
                usuario_id: req.user.id
            });
            res.status(201).json(venta);
        } catch (error) {
            console.error('Error al crear venta:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    getVentas: async (req, res) => {
        try {
            let { fechaDesde, fechaHasta } = req.query;

            // Los usuarios operativos solo pueden consultar los movimientos del día.
            if (req.user.rol !== 'admin') {
                fechaDesde = getTodayInArgentina();
                fechaHasta = fechaDesde;
            }

            const ventas = await VentaModel.getAll(fechaDesde, fechaHasta);
            res.json(ventas);
        } catch (error) {
            console.error('Error al obtener ventas:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    getDetallesVenta: async (req, res) => {
        try {
            const { id } = req.params;
            const fechaLimite = req.user.rol === 'admin' ? null : getTodayInArgentina();
            const detalles = await VentaModel.getDetalles(id, fechaLimite);

            if (detalles.length === 0) {
                return res.status(404).json({ error: 'Venta no encontrada o fuera del período permitido.' });
            }

            res.json(detalles);
        } catch (error) {
            console.error('Error al obtener detalles de venta:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    generarNotaCredito: async (req, res) => {
        try {
            const { id } = req.params;
            const nc = await VentaModel.generarNotaCredito(id, req.user ? req.user.id : null);
            res.status(201).json(nc);
        } catch (error) {
            console.error('Error al generar nota de crédito:', error);
            res.status(500).json({ error: error.message || 'Error interno del servidor' });
        }
    }
};

module.exports = ventaController;
