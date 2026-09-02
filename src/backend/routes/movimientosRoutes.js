const express = require("express");

const router = express.Router();

const {
    obtenerMovimientos,
    obtenerMovimientosProveedor,
    obtenerMovimientosCliente,
    obtenerResumenMovimientos,
    obtenerMovimientoPorId
} = require("../controllers/movimientosController");


// Obtener el historial completo.
// También permite filtros mediante query params.
router.get("/", obtenerMovimientos);


// Obtener resumen general.
// Debe colocarse antes de las rutas con parámetros.
router.get(
    "/resumen",
    obtenerResumenMovimientos
);


// Obtener movimientos de un proveedor.
router.get(
    "/proveedor/:id",
    obtenerMovimientosProveedor
);


// Obtener movimientos de un cliente.
router.get(
    "/cliente/:id",
    obtenerMovimientosCliente
);


// Obtener un movimiento por tipo e ID.
router.get(
    "/:tipo/:id",
    obtenerMovimientoPorId
);


module.exports = router;