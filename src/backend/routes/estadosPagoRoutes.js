const express = require("express");

const router = express.Router();

const {
    obtenerEstadosPago,
    obtenerFacturasPendientes,
    obtenerFacturasParciales,
    obtenerFacturasPagadas,
    obtenerEstadoPagoProveedor
} = require("../controllers/estadosPagoController");


// Obtener todas las facturas con su estado de pago
router.get("/", obtenerEstadosPago);


// Obtener facturas pendientes
router.get("/pendientes", obtenerFacturasPendientes);


// Obtener facturas parcialmente pagadas
router.get("/parciales", obtenerFacturasParciales);


// Obtener facturas pagadas
router.get("/pagadas", obtenerFacturasPagadas);


// Obtener estado de cuenta de un proveedor
router.get("/proveedor/:id", obtenerEstadoPagoProveedor);


module.exports = router;