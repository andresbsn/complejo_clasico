const express = require('express');
const router = express.Router();
const configuracionController = require('../controllers/configuracionController');

router.get('/', configuracionController.getAll);
router.put('/:clave', configuracionController.update);

module.exports = router;
