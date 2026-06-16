const pool = require('./src/backend/config/db');

async function fixTable() {
    try {
        console.log("Intentando añadir columna Observaciones...");
        await pool.query('ALTER TABLE Producto ADD COLUMN IF NOT EXISTS Observaciones TEXT;');
        console.log("¡Éxito! Columna añadida.");
        process.exit(0);
    } catch (error) {
        console.error("Error al añadir columna:", error.message);
        process.exit(1);
    }
}

fixTable();
