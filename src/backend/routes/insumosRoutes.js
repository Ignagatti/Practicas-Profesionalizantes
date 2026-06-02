const express = require('express');
const router = express.Router();
const insumosController = require('../controllers/insumosController');

router.get('/', insumosController.obtenerInsumos);
router.post('/', insumosController.crearInsumo);
router.put('/:id', insumosController.actualizarInsumo);
router.delete('/:id', insumosController.eliminarInsumo);

module.exports = router;
