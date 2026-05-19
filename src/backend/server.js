// 1. IMPORTACIONES 
const express = require('express');
require('dotenv').config();
const pool = require('./config/db');

// 2. CONFIGURACIÓN
const app = express();
const PORT = process.env.PORT || 4000;

// 3. PRUEBA DE CONEXIÓN A POSTGRES
pool.query('SELECT NOW()')
    .then(res => console.log('¡Conexión exitosa a PostgreSQL en el puerto 5433!'))
    .catch(err => console.error('Error al conectar a la base de datos:', err.stack));

// 4. ENCENDIDO DEL SERVIDOR
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en el puerto ${PORT}`);
});