// src/backend/routes/clientesRoutes.js
const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController'); // Traemos el controlador

// Definimos que el método GET en la raíz '/' activa la función del controlador
router.get('/', clientesController.obtenerClientes);
router.get('/:id', clientesController.obtenerClientePorId);
router.post('/', clientesController.crearCliente);
router.put('/:id', clientesController.actualizarCliente);
router.delete('/:id', clientesController.bloquearCliente);
router.put('/:id/desbloquear', clientesController.desbloquearCliente);
router.get('/:id/direcciones', clientesController.obtenerDireccionesCliente);
router.post('/:id/direcciones', clientesController.crearDireccionCliente);
router.put('/direcciones/:idDireccion', clientesController.actualizarDireccionCliente);
router.delete('/direcciones/:idDireccion', clientesController.eliminarDireccionCliente);

// Exportamos el enrutador para que el server.js lo conecte globalmente
module.exports = router;