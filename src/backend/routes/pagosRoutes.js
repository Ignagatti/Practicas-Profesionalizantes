const express = require("express");

const router = express.Router();

const {
    obtenerPagos,
    obtenerPagoPorId,
    crearPago,
    eliminarPago
} = require("../controllers/pagosController");


// Obtener todos los pagos
router.get("/", obtenerPagos);


// Obtener un pago por ID
router.get("/:id", obtenerPagoPorId);


// Crear un nuevo pago
router.post("/", crearPago);


// Eliminar un pago
router.delete("/:id", eliminarPago);


module.exports = router;