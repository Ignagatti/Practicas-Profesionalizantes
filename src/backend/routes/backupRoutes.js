const express = require("express");
const router = express.Router();
const { exportarBackup, restaurarBackup } = require("../controllers/backupController");

// Ruta para exportar y descargar dump SQL
router.get("/exportar", exportarBackup);

// Ruta para restaurar base de datos desde dump SQL
router.post("/restaurar", express.json({ limit: "50mb" }), restaurarBackup);

module.exports = router;
