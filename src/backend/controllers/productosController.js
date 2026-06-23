const pool = require('../config/db');

// OBTENER TODOS
const obtenerProductos = async (req, res) => {
    try {
        const resultado = await pool.query('SELECT *, Observaciones as observaciones FROM Producto ORDER BY Id_Producto ASC');
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error en obtenerProductos:', error.message);
        res.status(500).send('Error al buscar los productos');
    }
};

// CREAR NUEVO
const crearProducto = async (req, res) => {
    const { modelo, tela, color_lustre, estado, cantidad, precio, observaciones, fecha_pedido } = req.body;

    try {
        const query = 'INSERT INTO Producto (Modelo, Tela, Color_Lustre, Estado, Cantidad, Precio, Observaciones, Fecha_Pedido) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *';
        const valores = [modelo, tela, color_lustre, estado || 'pendiente', cantidad || 1, precio || 0, observaciones || '', fecha_pedido || new Date()];
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
    const { modelo, tela, color_lustre, estado, cantidad, precio, observaciones, fecha_pedido } = req.body;

    try {
        const query = 'UPDATE Producto SET Modelo = $1, Tela = $2, Color_Lustre = $3, Estado = $4, Cantidad = $5, Precio = $6, Observaciones = $7, Fecha_Pedido = $8 WHERE Id_Producto = $9 RETURNING *';
        const valores = [modelo, tela, color_lustre, estado, cantidad, precio, observaciones, fecha_pedido, id];
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
        if (resultado.rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json({ mensaje: 'Producto eliminado correctamente' });
    } catch (error) {
        console.error('Error en eliminarProducto:', error.message);
        res.status(500).json({ error: 'Error al eliminar el producto. Puede que esté vinculado a un pedido.' });
    }
};

module.exports = {
    obtenerProductos,
    crearProducto,
    actualizarProducto,
    eliminarProducto
};
