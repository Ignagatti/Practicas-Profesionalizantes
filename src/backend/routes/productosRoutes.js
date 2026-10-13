const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');

// Operaciones generales y planilla (CU02, CU16)
router.get('/', productosController.obtenerProductos);
router.post('/', productosController.crearProducto);

// Transiciones masivas de estado de producción (CU17, CU54)
// (Se declaran antes de las rutas con :id para evitar colisiones de parámetros)
router.put('/estado/terminar-masivo', productosController.terminarProductosMasivo);
router.put('/estado/enviar-masivo', productosController.enviarProductosMasivo);

// Operaciones sobre producto individual (CU12, CU13, CU14)
router.get('/:id', productosController.obtenerProductoPorId);
router.put('/:id', productosController.actualizarProducto);
router.delete('/:id', productosController.eliminarProducto);

module.exports = router;