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

app.use(express.json());

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
// COMPROBAR CONEXIÓN CON POSTGRESQL
// =====================================================

pool.query("SELECT NOW()")
    .then(() => {

        console.log("---");
        console.log("🚀 SERVIDOR ACTUALIZADO E INICIADO");
        console.log("✅ Ruta /api/facturasProveedor LISTA");
        console.log("✅ Ruta /api/pagos LISTA");
        console.log("✅ Ruta /api/estados-pago LISTA");
        console.log("✅ Ruta /api/saldos LISTA");
        console.log("---");

    })
    .catch((error) => {

        console.error(
            "Error al conectar a la base de datos:",
            error
        );

    });


// =====================================================
// INICIAR SERVIDOR
// =====================================================

app.listen(PORT, () => {

    console.log(
        `Servidor backend corriendo en el puerto ${PORT}`
    );

});