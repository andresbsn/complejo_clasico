const express = require('express');
const router = express.Router();
const canchaController = require('../controllers/canchaController');

router.get('/', canchaController.getAll);
router.get('/:id', canchaController.getById);
router.post('/', canchaController.create);
router.put('/:id', canchaController.update);
router.delete('/:id', canchaController.delete);

module.exports = router;
