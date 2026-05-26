// src/backend/server.js

// 1. IMPORTACIONES
const express = require('express');
require('dotenv').config();
const pool = require('./config/db');
const clientesRoutes = require('./routes/clientesRoutes'); // <-- Traemos tus rutas de clientes
const insumosRoutes = require('./routes/insumosRoutes');
const productosRoutes = require('./routes/productosRoutes');


// 2. CONFIGURACIÓN E INICIALIZACIÓN
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware obligatorio para que Express pueda leer datos enviados en formato JSON
app.use(express.json());

// 3. VINCULAR LAS RUTAS
// Esto hace que todas las rutas dentro de clientesRoutes comiencen con /api/clientes
app.use('/api/clientes', clientesRoutes);
app.use('/api/insumos', insumosRoutes);
app.use('/api/productos', productosRoutes);

// 4. PRUEBA DE CONEXIÓN AUTOMÁTICA A POSTGRES
pool.query('SELECT NOW()')
    .then(res => console.log('¡Conexión exitosa a PostgreSQL en el puerto 5433!'))
    .catch(err => console.error('Error al conectar a la base de datos:', err.stack));

// 5. ENCENDIDO DEL SERVIDOR
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en el puerto ${PORT}`);
});