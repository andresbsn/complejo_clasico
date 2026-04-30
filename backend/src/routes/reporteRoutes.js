const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');

router.get('/ventas', reporteController.getVentasReport);
router.get('/jugadores-categoria', reporteController.getJugadoresPorCategoria);
router.get('/deudores', reporteController.getDeudores);

module.exports = router;
