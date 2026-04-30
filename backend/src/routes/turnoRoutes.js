const express = require('express');
const router = express.Router();
const TurnoController = require('../controllers/turnoController');
const { checkCajaAbierta } = require('../middleware/cajaMiddleware');

// GET /api/turnos?fecha=YYYY-MM-DD&cancha_id=X
router.get('/', TurnoController.getTurnos);

// POST /api/turnos
router.post('/', TurnoController.createTurno);

// POST /api/turnos/:id/pagos
router.post('/:id/pagos', checkCajaAbierta, TurnoController.registrarPago);

// PATCH /api/turnos/:id/status
router.patch('/:id/status', TurnoController.updateStatus);

// DELETE /api/turnos/fijos/:id
router.delete('/fijos/:id', TurnoController.deleteFijo);

module.exports = router;
