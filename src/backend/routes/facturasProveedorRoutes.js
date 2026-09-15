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

const fileFilter = (req, file, cb) => {
    const allowedMimes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    const allowedExts = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error("Tipo de archivo no permitido. Solo se admiten documentos PDF e imágenes (JPG, PNG, WEBP)."), false);
    }
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../uploads/"));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, "factura-" + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Límite de 10 MB
    fileFilter
});

router.get("/", obtenerFacturas);
router.get("/:id", obtenerFacturaPorId);
router.post("/", upload.single("archivo_pdf"), crearFactura);
router.put("/:id", upload.single("archivo_pdf"), editarFactura);
router.delete("/:id", eliminarFactura);

module.exports = router;