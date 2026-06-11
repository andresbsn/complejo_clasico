const express = require('express');
const router = express.Router();
const cuentaController = require('../controllers/cuentaController');
const { checkCajaAbierta } = require('../middleware/cajaMiddleware');
const { ensureAdmin } = require('../middleware/roleMiddleware');

router.get('/:jugadorId', cuentaController.getMovimientos);
router.post('/', checkCajaAbierta, cuentaController.addMovimiento);
router.delete('/movimientos/:id', ensureAdmin, cuentaController.deleteMovimiento);

module.exports = router;
