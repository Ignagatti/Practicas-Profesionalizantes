const express = require("express");
const router = express.Router();
const {
    obtenerFacturas,
    obtenerFacturaPorId,
    crearFactura,
    editarFactura,
    eliminarFactura
} = require("../controllers/facturasProveedorController");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../uploads/"));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, "factura-" + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

router.get("/", obtenerFacturas);
router.get("/:id", obtenerFacturaPorId);
router.post("/", upload.single("archivo_pdf"), crearFactura);
router.put("/:id", upload.single("archivo_pdf"), editarFactura);
router.delete("/:id", eliminarFactura);

module.exports = router;