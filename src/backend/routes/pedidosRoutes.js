const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const fileFilter = (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido. Solo se admiten documentos PDF e imágenes (JPG, PNG, WEBP).'), false);
    }
};

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // Límite de 10 MB
    fileFilter
});
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

// Ruta para eliminar pedido
router.delete('/:id', pedidosController.eliminarPedido);

module.exports = router;