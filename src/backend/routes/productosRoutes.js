const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');

router.get('/', productosController.obtenerProductos);
router.post('/', productosController.crearProducto);
router.put('/:id', productosController.actualizarProducto);
router.delete('/:id', productosController.eliminarProducto);
router.put('/estado/terminar-masivo', productosController.terminarProductosMasivo);

module.exports = router;