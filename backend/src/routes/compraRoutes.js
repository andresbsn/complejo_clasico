const express = require('express');
const router = express.Router();
const CompraController = require('../controllers/compraController');

router.get('/', CompraController.getAll);
router.get('/:id', CompraController.getById);
router.post('/', CompraController.create);
router.put('/:id', CompraController.update);
router.post('/:id/confirmar', CompraController.confirmar);
router.delete('/:id', CompraController.delete);

module.exports = router;
