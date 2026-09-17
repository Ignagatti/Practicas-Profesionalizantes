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
const licenciaRoutes = require("./routes/licenciaRoutes");
const backupRoutes = require("./routes/backupRoutes");
const { validarLicenciaMiddleware } = require("./controllers/licenciaController");

const app = express();

const PORT = process.env.PORT || 4000;


// =====================================================
// MIDDLEWARES DE SEGURIDAD
// =====================================================

const helmet = require("helmet");
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false // Permite flexibilidad con Vite y Electron en desarrollo
}));

const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4000",
    "http://127.0.0.1:4000"
];

app.use(cors({
    origin: function (origin, callback) {
        // Permitir peticiones sin origen (apps de escritorio Electron, herramientas internas, scripts)
        if (!origin || allowedOrigins.includes(origin) || origin.startsWith("http://localhost:") || origin.startsWith("file://")) {
            return callback(null, true);
        }
        return callback(new Error("Acceso no permitido por la política CORS"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "x-license-key"]
}));

const path = require("path");

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =====================================================
// RUTAS
// =====================================================

// Verificación y estado de licencias (público)
app.use("/api/licencia", licenciaRoutes);

// Escudo de seguridad: valida clave de licencia activa en toda la API
app.use("/api", validarLicenciaMiddleware);

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

app.use(
    "/api/backup",
    backupRoutes
);

// Endpoint de comprobación de estado para Electron y clientes
app.get("/api/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.json({ status: "ok", db: "connected" });
    } catch (err) {
        res.status(200).json({ status: "connecting", error: err.message });
    }
});

// =====================================================
// INICIAR SERVIDOR Y SINCRONIZAR BASE DE DATOS
// =====================================================

const migrate = require("./scripts/migrate");

const server = app.listen(PORT, () => {
    console.log(`El servidor se conectó y está escuchando en el puerto ${PORT}`);
    
    // Verificar conexión a PostgreSQL y ejecutar migraciones
    pool.query("SELECT NOW()")
        .then(async () => {
            await migrate();
            console.log("Conectado a la Base de Datos PostgreSQL y migraciones ejecutadas.");
        })
        .catch((error) => {
            console.error(
                "Error general: No se pudo conectar a la base de datos PostgreSQL:",
                error
            );
        });
});

module.exports = { app, server };