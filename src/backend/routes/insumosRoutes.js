const express = require('express');
const router = express.Router();
const insumosController = require('../controllers/insumosController');

// Rutas fijas antes de rutas con parámetros dinámicos (:id)
router.get('/', insumosController.obtenerInsumos);
router.post('/', insumosController.crearInsumo);
router.post('/ajustar-precios', insumosController.ajustarPrecios);
router.put('/ajustar-precios', insumosController.ajustarPrecios);

// Rutas con ID
router.put('/:id', insumosController.actualizarInsumo);
router.delete('/:id', insumosController.eliminarInsumo);

module.exports = router;
