const pool = require('./src/backend/config/db.js');
(async () => {
    try {
        await pool.query("ALTER TYPE estado_facturacion RENAME VALUE 'pendiente' TO 'no_se_factura'");
        console.log("Renombrado pendiente -> no_se_factura");
    } catch (e) {
        if (e.code === '42710') {
            console.log("no_se_factura ya existe");
        } else {
            console.error("Error al renombrar pendiente:", e.message);
        }
    }

    try {
        await pool.query("ALTER TYPE estado_facturacion RENAME VALUE 'facturado' TO 'se_factura'");
        console.log("Renombrado facturado -> se_factura");
    } catch (e) {
        if (e.code === '42710') {
            console.log("se_factura ya existe");
        } else {
            console.error("Error al renombrar facturado:", e.message);
        }
    }
    
    // Y probamos alterar la base de datos Script.sql para sincronizarlo.
    pool.end();
})();
