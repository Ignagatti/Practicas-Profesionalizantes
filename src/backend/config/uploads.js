const fs = require("fs");
const path = require("path");

/**
 * Resuelve la carpeta de archivos subidos (PDFs e imágenes).
 * En Electron empaquetado usa userData (escribible); en desarrollo usa src/backend/uploads.
 */
function getUploadsDir() {
    const uploadsDir = process.env.UPLOADS_DIR
        ? path.resolve(process.env.UPLOADS_DIR)
        : path.join(__dirname, "../uploads");

    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    return uploadsDir;
}

module.exports = { getUploadsDir };

