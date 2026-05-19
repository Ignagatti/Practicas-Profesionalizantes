// src/backend/controllers/clientesController.js
const pool = require('../config/db'); // Traemos el cable de conexión

// Creamos la función asíncrona para traer los clientes
const obtenerClientes = async (req, res) => {
    try {
        // IMPORTANTE: Respetamos la mayúscula de la tabla "Cliente" de tu Script.sql
        const resultado = await pool.query('SELECT * FROM Cliente ORDER BY Id_Cliente ASC');

        // Mandamos las filas (.rows) de la tabla directo al navegador o frontend en formato JSON
        res.json(resultado.rows);

    } catch (error) {
        // Si algo sale mal (ej: escribiste mal la tabla), se registra acá
        console.error('Error en obtenerClientes:', error.message);
        res.status(500).send('Error interno del servidor al buscar los clientes');
    }
};

// Exportamos la función entre llaves para que la carpeta /routes la pueda usar
module.exports = {
    obtenerClientes,
};