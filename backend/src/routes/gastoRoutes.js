const express = require('express');
const router = express.Router();
const GastoController = require('../controllers/gastoController');
const { checkCajaAbierta } = require('../middleware/cajaMiddleware');

router.post('/', checkCajaAbierta, GastoController.create);
router.get('/', GastoController.getAll);
router.delete('/:id', GastoController.delete);

module.exports = router;
