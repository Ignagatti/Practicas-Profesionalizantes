const pool = require('../config/db');

// OBTENER TODOS (Solo activos por defecto)
const obtenerProductos = async (req, res) => {
    try {
        const { incluirInactivos } = req.query;
        let filtroActivo = 'WHERE (p.activo = true OR p.activo IS NULL)';
        if (incluirInactivos === 'true') {
            filtroActivo = '';
        }

        const query = `
            SELECT p.*, p.Observaciones as observaciones, 
                   CASE 
                       WHEN NULLIF(TRIM(COALESCE(c.Nombre, '') || ' ' || COALESCE(c.Apellido, '')), '') IS NOT NULL 
                       THEN TRIM(COALESCE(c.Nombre, '') || ' ' || COALESCE(c.Apellido, ''))
                       ELSE c.Razon_Social 
                   END as cliente 
            FROM Producto p 
            LEFT JOIN Cliente c ON p.Id_Cliente = c.Id_Cliente 
            ${filtroActivo}
            ORDER BY p.Fecha_Pedido DESC, p.Id_Producto DESC
        `;
        const resultado = await pool.query(query);
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error en obtenerProductos:', error.message);
        res.status(500).send('Error al buscar los productos');
    }
};

// CREAR NUEVO
const crearProducto = async (req, res) => {
    const { modelo, tela, color_lustre, estado, cantidad, precio, observaciones, fecha_pedido, id_cliente } = req.body;

    if (Number(cantidad) <= 0) {
        return res.status(400).json({ error: 'La cantidad del producto debe ser mayor a cero (no se permiten cantidades en cero o negativas).' });
    }

    try {
        const query = 'INSERT INTO Producto (Modelo, Tela, Color_Lustre, Estado, Cantidad, Precio, Observaciones, Fecha_Pedido, Id_Cliente, Activo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true) RETURNING *';
        const valores = [modelo, tela, color_lustre, estado || 'pendiente', cantidad || 1, precio || 0, observaciones || '', fecha_pedido || new Date(), id_cliente || null];
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
    const { modelo, tela, color_lustre, estado, cantidad, precio, observaciones, fecha_pedido, id_cliente } = req.body;

    if (Number(cantidad) <= 0) {
        return res.status(400).json({ error: 'La cantidad debe ser mayor a cero.' });
    }

    try {
        const prodActual = await pool.query('SELECT Estado FROM Producto WHERE Id_Producto = $1', [id]);
        if (prodActual.rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado' });

        const query = 'UPDATE Producto SET Modelo = $1, Tela = $2, Color_Lustre = $3, Estado = COALESCE($4, Estado), Cantidad = $5, Precio = $6, Observaciones = $7, Fecha_Pedido = $8, Id_Cliente = $9 WHERE Id_Producto = $10 RETURNING *';
        const valores = [modelo, tela, color_lustre, estado, cantidad, precio, observaciones, fecha_pedido, id_cliente || null, id];
        const resultado = await pool.query(query, valores);

        res.json(resultado.rows[0]);
    } catch (error) {
        console.error('Error en actualizarProducto:', error.message);
        res.status(500).json({ error: error.message || 'Error al actualizar el producto' });
    }
};

// BORRAR (Soft Delete / Baja lógica)
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

        // 2. Soft Delete: Desactivar producto preservando históricos en pedidos
        const resultado = await pool.query(
            'UPDATE Producto SET Activo = false, Eliminado_En = NOW() WHERE Id_Producto = $1 RETURNING *',
            [id]
        );
        res.json({ mensaje: 'Producto desactivado correctamente', producto: resultado.rows[0] });
    } catch (error) {
        console.error('Error en eliminarProducto:', error.message);
        res.status(500).json({ error: 'Error al intentar eliminar el producto.' });
    }
};

// PASAR DE EN PRODUCCIÓN A TERMINADO
const terminarProductosMasivo = async (req, res) => {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Debe proporcionar una lista de IDs válida.' });
    }

    try {
        const query = `
            UPDATE Producto 
            SET Estado = 'terminado' 
            WHERE Id_Producto = ANY($1) AND Estado = 'en_produccion'
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

// PASAR DE TERMINADO A ENVIADO
const enviarProductosMasivo = async (req, res) => {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Debe proporcionar una lista de IDs válida.' });
    }

    try {
        const query = `
            UPDATE Producto 
            SET Estado = 'enviado' 
            WHERE Id_Producto = ANY($1) AND Estado = 'terminado'
            RETURNING *
        `;
        const resultado = await pool.query(query, [ids]);

        if (resultado.rowCount === 0) {
            return res.status(404).json({ mensaje: 'No se encontraron productos terminados para marcar como enviados.' });
        }

        res.json({
            mensaje: `${resultado.rowCount} producto(s) pasaron a estado "enviado".`,
            productosActualizados: resultado.rows
        });
    } catch (error) {
        console.error('Error en enviarProductosMasivo:', error.message);
        res.status(500).json({ error: 'Error al actualizar el estado de los productos a enviado.' });
    }
};

module.exports = {
    obtenerProductos,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    terminarProductosMasivo,
    enviarProductosMasivo
};

