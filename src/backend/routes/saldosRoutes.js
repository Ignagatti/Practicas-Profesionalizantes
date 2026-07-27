const express = require("express");

const router = express.Router();

const {
    obtenerSaldosProveedores,
    obtenerSaldoProveedor,
    recalcularSaldoProveedor,
    recalcularTodosLosSaldos
} = require("../controllers/saldosController");


// Obtener los saldos de todos los proveedores
router.get("/", obtenerSaldosProveedores);


// Recalcular todos los saldos
// Esta ruta debe ir antes de "/:id"
router.put("/recalcular-todos", recalcularTodosLosSaldos);


// Obtener el saldo de un proveedor
router.get("/:id", obtenerSaldoProveedor);


// Recalcular el saldo de un proveedor
router.put("/:id/recalcular", recalcularSaldoProveedor);


module.exports = router;