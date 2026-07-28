const express = require("express");
const router = express.Router();
const {
    obtenerFacturas,
    obtenerFacturaPorId,
    crearFactura,
    editarFactura,
    eliminarFactura
} = require("../controllers/facturasProveedorController");
router.get("/", obtenerFacturas);
router.get("/:id", obtenerFacturaPorId);
router.post("/", crearFactura);
router.put("/:id", editarFactura);
router.delete("/:id", eliminarFactura);

module.exports = router;