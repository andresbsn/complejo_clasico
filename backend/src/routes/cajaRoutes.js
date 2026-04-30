const express = require('express');
const router = express.Router();
const CajaController = require('../controllers/cajaController');
// const authMiddleware = require('../middleware/authMiddleware'); // Add if needed

router.post('/abrir', CajaController.abrir);
router.put('/:id/cerrar', CajaController.cerrar);
router.get('/estado', CajaController.getEstado);
router.get('/historial', CajaController.getHistorial); // Define specific routes before :id
router.get('/:id', CajaController.getById);
router.get('/:id/movimientos', CajaController.getMovimientos);

module.exports = router;
