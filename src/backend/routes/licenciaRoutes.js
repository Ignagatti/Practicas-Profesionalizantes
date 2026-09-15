const express = require('express');
const router = express.Router();
const { verificarLicencia, obtenerEstadoLicencia } = require('../controllers/licenciaController');

router.post('/verificar', verificarLicencia);
router.get('/estado', obtenerEstadoLicencia);

module.exports = router;
