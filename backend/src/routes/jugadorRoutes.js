const express = require('express');
const router = express.Router();
const JugadorController = require('../controllers/jugadorController');

router.get('/', JugadorController.getAll);
router.post('/', JugadorController.create);
router.put('/:id', JugadorController.update);

module.exports = router;
