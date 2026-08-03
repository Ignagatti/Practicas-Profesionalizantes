const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');

router.get('/', pedidosController.obtenerPedidos);
router.get('/produccion', pedidosController.obtenerProduccion);
router.get('/productos-disponibles/:idCliente', pedidosController.obtenerProductosDisponiblesPorCliente);

router.post('/', pedidosController.crearPedido);

router.put('/productos/:idProducto/estado', pedidosController.cambiarEstadoProducto);

router.get('/:id', pedidosController.obtenerPedidoPorId);

module.exports = router;