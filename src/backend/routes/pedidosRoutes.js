const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const pedidosController = require('../controllers/pedidosController');

router.get('/', pedidosController.obtenerPedidos);
router.get('/produccion', pedidosController.obtenerProduccion);
router.get('/productos-disponibles/:idCliente', pedidosController.obtenerProductosDisponiblesPorCliente);

router.post('/', pedidosController.crearPedido);

router.put('/productos/:idProducto/estado', pedidosController.cambiarEstadoProducto);

router.put('/:id', pedidosController.actualizarPedido);

router.get('/:id', pedidosController.obtenerPedidoPorId);

// Rutas de archivos de factura (PDF)
router.put('/:id/factura', upload.single('Pdf_Factura'), pedidosController.subirFactura);
router.get('/:id/factura/pdf', pedidosController.descargarPdfFactura);
router.delete('/:id/factura/pdf', pedidosController.eliminarPdfFactura);

module.exports = router;