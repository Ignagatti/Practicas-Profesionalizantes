const express = require("express");

const router = express.Router();

const {
    obtenerPagos,
    obtenerPagoPorId,
    crearPago,
    editarPago,
    eliminarPago
} = require("../controllers/pagosController");


// Obtener todos los pagos
router.get("/", obtenerPagos);


// Obtener un pago por ID
router.get("/:id", obtenerPagoPorId);


// Crear un nuevo pago
router.post("/", crearPago);


// Editar un pago
router.put("/:id", editarPago);


// Eliminar un pago
router.delete("/:id", eliminarPago);


module.exports = router;