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
        // 1. Verificamos el estado antes de borrar
        const producto = await pool.query('SELECT Estado FROM Producto WHERE Id_Producto = $1', [id]);

        if (producto.rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado' });

        const estado = (producto.rows[0].Estado || "").toLowerCase();

        if (estado === 'en_produccion') {
            return res.status(400).json({
                error: 'No se puede eliminar un producto que ya está EN PRODUCCIÓN.'
            });
        }

        // 2. Si no está en producción, procedemos al borrado
        await pool.query('DELETE FROM Producto WHERE Id_Producto = $1', [id]);
        res.json({ mensaje: 'Producto eliminado correctamente' });
    } catch (error) {
        console.error('Error en eliminarProducto:', error.message);
        res.status(500).json({ error: 'Error al intentar eliminar el producto.' });
    }
};

// PASAR DE EN PRODUCCIÓN A TERMINADO
const terminarProductosMasivo = async (req, res) => {
    const { ids } = req.body; // Esperamos un array de IDs: [1, 2, 3]

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Debe proporcionar una lista de IDs válida.' });
    }

    try {
        // Actualiza a 'terminado' solo aquellos que estén 'en_produccion' dentro de la lista de IDs proporcionada
        const query = `
            UPDATE Producto 
            SET Estado = 'terminado' 
            WHERE Id_Producto = ANY($1) AND LOWER(Estado) = 'en_produccion'
            RETURNING *
        `;
        const resultado = await pool.query(query, [ids]);

        if (resultado.rowCount === 0) {
            return res.status(404).json({ mensaje: 'No se encontraron productos en producción para actualizar.' });
        }

        res.json({
            mensaje: `${resultado.rowCount} producto(s) pasaron a estado "terminado".`,
            productosActualizados: resultado.rows
        });
    } catch (error) {
        console.error('Error en terminarProductosMasivo:', error.message);
        res.status(500).json({ error: 'Error al actualizar el estado de los productos.' });
    }
};

module.exports = {
    obtenerProductos,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    terminarProductosMasivo
};
