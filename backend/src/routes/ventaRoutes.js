const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');
const { checkCajaAbierta } = require('../middleware/cajaMiddleware');

router.post('/', checkCajaAbierta, ventaController.createVenta);
router.get('/', ventaController.getVentas);
router.get('/:id/detalles', ventaController.getDetallesVenta);
router.post('/:id/nota-credito', ventaController.generarNotaCredito);

module.exports = router;
