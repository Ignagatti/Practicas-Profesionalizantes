const express = require('express');
const router = express.Router();
const insumosController = require('../controllers/insumosController');

// Cuando pidan la raíz de insumos, ejecutamos "obtenerInsumos"
router.get('/', insumosController.obtenerInsumos);

module.exports = router;
