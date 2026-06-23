const express = require('express');
require('dotenv').config();
const pool = require('./config/db');
const clientesRoutes = require('./routes/clientesRoutes'); 
const proveedoresRoutes = require('./routes/proveedoresRoutes');
const insumosRoutes = require('./routes/insumosRoutes');
const productosRoutes = require('./routes/productosRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

const cors = require('cors');

app.use(cors());
app.use(express.json());

app.use('/api/clientes', clientesRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/insumos', insumosRoutes);
app.use('/api/productos', productosRoutes);

pool.query('SELECT NOW()')
    .then(res => console.log('¡Conexión exitosa a PostgreSQL en el puerto 5433!'))
    .catch(err => console.error('Error al conectar a la base de datos:', err.stack));

app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en el puerto ${PORT}`);
});