const express = require('express');
const router = express.Router();
const proveedorController = require('../controllers/proveedorController');
const { checkCajaAbierta } = require('../middleware/cajaMiddleware');

router.get('/', proveedorController.getAll);
router.post('/', proveedorController.create);
router.put('/:id', proveedorController.update);
router.delete('/:id', proveedorController.delete);
router.get('/:id/cuenta', proveedorController.getCuenta);
router.post('/movimiento', checkCajaAbierta, proveedorController.addMovimiento);

module.exports = router;
