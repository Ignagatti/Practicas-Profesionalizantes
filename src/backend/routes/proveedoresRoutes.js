const express = require('express');
const router = express.Router();
const proveedoresController = require('../controllers/proveedoresController');

router.get('/', proveedoresController.obtenerProveedores);
router.get('/:id', proveedoresController.obtenerProveedorPorId);
router.post('/', proveedoresController.crearProveedor);
router.put('/:id', proveedoresController.actualizarProveedor);
router.delete('/:id', proveedoresController.bloquearProveedor);
router.put('/:id/desbloquear', proveedoresController.desbloquearProveedor);

module.exports = router;