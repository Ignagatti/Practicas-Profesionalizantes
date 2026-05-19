// src/backend/routes/clientesRoutes.js
const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');

// Cuando alguien entre a la raíz de esta ruta, ejecuta la función del controlador
router.get('/', clientesController.obtenerClientes);

module.exports = router;