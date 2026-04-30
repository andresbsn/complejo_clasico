const express = require('express');
const router = express.Router();
const cuentaController = require('../controllers/cuentaController');
const { checkCajaAbierta } = require('../middleware/cajaMiddleware');

router.get('/:jugadorId', cuentaController.getMovimientos);
router.post('/', checkCajaAbierta, cuentaController.addMovimiento);

module.exports = router;
