const pool = require('../config/db');

const obtenerInsumos = async (req, res) => {
    try {
        // Consultamos la tabla "Insumo" (como está en tu SQL)
        const resultado = await pool.query('SELECT * FROM Insumo ORDER BY Id_Insumo ASC');
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error en obtenerInsumos:', error.message);
        res.status(500).send('Error al buscar los insumos');
    }
};

module.exports = {
    obtenerInsumos,
};
