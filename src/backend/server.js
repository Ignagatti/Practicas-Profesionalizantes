const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db');
const clientesRoutes = require('./routes/clientesRoutes'); 
const proveedoresRoutes = require('./routes/proveedoresRoutes');
const insumosRoutes = require('./routes/insumosRoutes');
const productosRoutes = require('./routes/productosRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware de CORS para permitir peticiones del frontend
app.use(cors());

// Middleware obligatorio para que Express pueda leer datos enviados en formato JSON
app.use(express.json());

app.use('/api/clientes', clientesRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/insumos', insumosRoutes);
app.use('/api/productos', productosRoutes);

pool.query('SELECT NOW()')
    .then(res => {
        console.log('---');
        console.log('🚀 SERVIDOR ACTUALIZADO E INICIADO');
        console.log('✅ Ruta /api/insumos/ajustar-precios LISTA');
        console.log('---');
    })
    .catch(err => console.error('Error al conectar a la base de datos:', err.stack));

app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en el puerto ${PORT}`);
});