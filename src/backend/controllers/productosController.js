const pool = require('../config/db');

// OBTENER TODOS
const obtenerProductos = async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM Producto ORDER BY Id_Producto ASC');
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error en obtenerProductos:', error.message);
        res.status(500).send('Error al buscar los productos');
    }
};

// CREAR NUEVO
const crearProducto = async (req, res) => {
    const { modelo, tela, color_lustre, estado, cantidad, precio } = req.body;

    // VALIDACIÓN BÁSICA
    if (!modelo || !estado || precio === undefined) {
        return res.status(400).send('Faltan datos obligatorios del producto');
    }

    try {
        const query = 'INSERT INTO Producto (Modelo, Tela, Color_Lustre, Estado, Cantidad, Precio) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
        const valores = [modelo, tela, color_lustre, estado, cantidad, precio];
        const resultado = await pool.query(query, valores);
        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        console.error('Error en crearProducto:', error.message);
        res.status(500).send('Error al crear el producto');
    }
};

// ACTUALIZAR
const actualizarProducto = async (req, res) => {
    const { id } = req.params;
    const { modelo, tela, color_lustre, estado, cantidad, precio } = req.body;

    try {
        const query = 'UPDATE Producto SET Modelo = $1, Tela = $2, Color_Lustre = $3, Estado = $4, Cantidad = $5, Precio = $6 WHERE Id_Producto = $7 RETURNING *';
        const valores = [modelo, tela, color_lustre, estado, cantidad, precio, id];
        const resultado = await pool.query(query, valores);

        if (resultado.rowCount === 0) return res.status(404).send('Producto no encontrado');
        res.json(resultado.rows[0]);
    } catch (error) {
        console.error('Error en actualizarProducto:', error.message);
        res.status(500).send('Error al actualizar el producto');
    }
};

// BORRAR
const eliminarProducto = async (req, res) => {
    const { id } = req.params;
    try {
        const resultado = await pool.query('DELETE FROM Producto WHERE Id_Producto = $1', [id]);
        if (resultado.rowCount === 0) return res.status(404).send('Producto no encontrado');
        res.send('Producto eliminado correctamente');
    } catch (error) {
        console.error('Error en eliminarProducto:', error.message);
        res.status(500).send('Error al eliminar el producto');
    }
};

module.exports = {
    obtenerProductos,
    crearProducto,
    actualizarProducto,
    eliminarProducto
};
