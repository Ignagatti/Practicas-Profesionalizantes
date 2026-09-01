process.removeAllListeners('warning');
const express = require("express");
const cors = require("cors");
require("dotenv").config();


const pool = require("./config/db");

const movimientosRoutes = require("./routes/movimientosRoutes");
const clientesRoutes = require("./routes/clientesRoutes");
const proveedoresRoutes = require("./routes/proveedoresRoutes");
const insumosRoutes = require("./routes/insumosRoutes");
const productosRoutes = require("./routes/productosRoutes");
const pedidosRoutes = require("./routes/pedidosRoutes");

const facturasProveedorRoutes = require("./routes/facturasProveedorRoutes");
const pagosRoutes = require("./routes/pagosRoutes");
const estadosPagoRoutes = require("./routes/estadosPagoRoutes");
const saldosRoutes = require("./routes/saldosRoutes");

const app = express();

const PORT = process.env.PORT || 4000;


// =====================================================
// MIDDLEWARES
// =====================================================

app.use(cors());

const path = require("path");

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =====================================================
// RUTAS
// =====================================================

app.use("/api/clientes", clientesRoutes);
app.use("/api/pedidos", pedidosRoutes);

app.use("/api/proveedores", proveedoresRoutes);

app.use("/api/insumos", insumosRoutes);

app.use("/api/productos", productosRoutes);

app.use(
    "/api/facturasProveedor",
    facturasProveedorRoutes
);

app.use(
    "/api/pagos",
    pagosRoutes
);

app.use(
    "/api/estados-pago",
    estadosPagoRoutes
);

app.use(
    "/api/saldos",
    saldosRoutes
);

app.use(
    "/api/movimientos",
    movimientosRoutes
);

// =====================================================
// COMPROBAR CONEXIÓN CON POSTGRESQL E INICIAR SERVIDOR
// =====================================================

pool.query("SELECT NOW()")
    .then(() => {
        app.listen(PORT, () => {
            console.log(`El servidor se conectó a la Base de Datos correctamente en el puerto ${PORT}`);
        });
    })
    .catch((error) => {
        console.error(
            "Error general: No se pudo conectar a la base de datos PostgreSQL:",
            error
        );
    });