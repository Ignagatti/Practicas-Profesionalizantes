const pool = require('../config/db');

const ESTADOS_PRODUCTO_VALIDOS = [
    'pendiente',
    'en_produccion',
    'terminado',
    'enviado',
    'cancelado'
];

const ESTADOS_PAGO_VALIDOS = [
    'pendiente',
    'parcial',
    'pagado'
];

const ESTADOS_FACTURACION_VALIDOS = [
    'sin_factura',
    'pendiente',
    'facturado'
];

const obtenerPedidos = async (req, res) => {
    try {
        const { search, estado, fechaDesde, fechaHasta } = req.query;

        const condiciones = [];
        const valores = [];

        if (search) {
            valores.push(`%${search.toLowerCase()}%`);
            condiciones.push(`
                (
                    LOWER(c.Nombre) LIKE $${valores.length}
                    OR LOWER(c.Apellido) LIKE $${valores.length}
                    OR LOWER(COALESCE(c.Razon_Social, '')) LIKE $${valores.length}
                    OR CAST(p.Id_Pedido AS TEXT) LIKE $${valores.length}
                )
            `);
        }

        if (fechaDesde) {
            valores.push(fechaDesde);
            condiciones.push(`p.Fecha_Generacion::date >= $${valores.length}`);
        }

        if (fechaHasta) {
            valores.push(fechaHasta);
            condiciones.push(`p.Fecha_Generacion::date <= $${valores.length}`);
        }

        if (estado && estado !== 'todos') {
            valores.push(estado);
            condiciones.push(`
                EXISTS (
                    SELECT 1
                    FROM Detalle_Pedido dp2
                    JOIN Producto pr2 ON pr2.Id_Producto = dp2.Id_Producto
                    WHERE dp2.Id_Pedido = p.Id_Pedido
                    AND pr2.Estado = $${valores.length}
                )
            `);
        }

        const where = condiciones.length > 0
            ? `WHERE ${condiciones.join(' AND ')}`
            : '';

        const resultado = await pool.query(
            `
            SELECT 
                p.Id_Pedido,
                p.Fecha_Generacion,
                p.Vencimiento,
                p.Observaciones,
                p.Precio_Total,
                p.Estado_Facturacion,
                p.Nro_Factura,
                p.Monto_Adeudado,
                p.Estado_Pago,

                c.Id_Cliente,
                c.Nombre,
                c.Apellido,
                c.Razon_Social,
                c.Telefono,
                c.Email,

                COALESCE(
                    json_agg(
                        json_build_object(
                            'id_producto', pr.Id_Producto,
                            'modelo', pr.Modelo,
                            'tela', pr.Tela,
                            'color_lustre', pr.Color_Lustre,
                            'estado', pr.Estado,
                            'fecha_pedido', pr.Fecha_Pedido,
                            'cantidad', pr.Cantidad,
                            'precio', pr.Precio
                        )
                    ) FILTER (WHERE pr.Id_Producto IS NOT NULL),
                    '[]'
                ) AS productos
            FROM Pedido p
            JOIN Cliente c ON c.Id_Cliente = p.Id_Cliente
            LEFT JOIN Detalle_Pedido dp ON dp.Id_Pedido = p.Id_Pedido
            LEFT JOIN Producto pr ON pr.Id_Producto = dp.Id_Producto
            ${where}
            GROUP BY p.Id_Pedido, c.Id_Cliente
            ORDER BY p.Id_Pedido DESC
            `,
            valores
        );

        res.json(resultado.rows);
    } catch (error) {
        console.error('Error en obtenerPedidos:', error.message);
        res.status(500).json({
            error: 'Error al obtener pedidos',
            detalle: error.message
        });
    }
};

const obtenerPedidoPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await pool.query(
            `
            SELECT 
                p.Id_Pedido,
                p.Fecha_Generacion,
                p.Vencimiento,
                p.Observaciones,
                p.Precio_Total,
                p.Estado_Facturacion,
                p.Nro_Factura,
                p.Monto_Adeudado,
                p.Estado_Pago,

                c.Id_Cliente,
                c.Nombre,
                c.Apellido,
                c.Razon_Social,
                c.Telefono,
                c.Email,

                COALESCE(
                    json_agg(
                        json_build_object(
                            'id_producto', pr.Id_Producto,
                            'modelo', pr.Modelo,
                            'tela', pr.Tela,
                            'color_lustre', pr.Color_Lustre,
                            'estado', pr.Estado,
                            'fecha_pedido', pr.Fecha_Pedido,
                            'cantidad', pr.Cantidad,
                            'precio', pr.Precio
                        )
                    ) FILTER (WHERE pr.Id_Producto IS NOT NULL),
                    '[]'
                ) AS productos
            FROM Pedido p
            JOIN Cliente c ON c.Id_Cliente = p.Id_Cliente
            LEFT JOIN Detalle_Pedido dp ON dp.Id_Pedido = p.Id_Pedido
            LEFT JOIN Producto pr ON pr.Id_Producto = dp.Id_Producto
            WHERE p.Id_Pedido = $1
            GROUP BY p.Id_Pedido, c.Id_Cliente
            `,
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        res.json(resultado.rows[0]);
    } catch (error) {
        console.error('Error en obtenerPedidoPorId:', error.message);
        res.status(500).json({
            error: 'Error al obtener pedido',
            detalle: error.message
        });
    }
};

const obtenerProductosDisponiblesPorCliente = async (req, res) => {
    try {
        const { idCliente } = req.params;

        const resultado = await pool.query(
            `
            SELECT 
                pr.Id_Producto,
                pr.Modelo,
                pr.Tela,
                pr.Color_Lustre,
                pr.Estado,
                pr.Fecha_Pedido,
                pr.Cantidad,
                pr.Precio,
                pr.Id_Cliente
            FROM Producto pr
            WHERE pr.Id_Cliente = $1
              AND NOT EXISTS (
                  SELECT 1
                  FROM Detalle_Pedido dp
                  WHERE dp.Id_Producto = pr.Id_Producto
              )
            ORDER BY pr.Id_Producto DESC
            `,
            [idCliente]
        );

        res.json(resultado.rows);
    } catch (error) {
        console.error('Error en obtenerProductosDisponiblesPorCliente:', error.message);
        res.status(500).json({
            error: 'Error al obtener productos disponibles',
            detalle: error.message
        });
    }
};

const crearPedido = async (req, res) => {
    const client = await pool.connect();

    try {
        const {
            Id_Cliente,
            Vencimiento,
            Observaciones,
            productos,
            Estado_Facturacion,
            Nro_Factura,
            Estado_Pago
        } = req.body;

        if (!Id_Cliente) {
            return res.status(400).json({
                error: 'Debe seleccionar un cliente'
            });
        }

        if (!Array.isArray(productos) || productos.length === 0) {
            return res.status(400).json({
                error: 'Debe seleccionar al menos un producto'
            });
        }

        const estadoPagoFinal = Estado_Pago || 'pendiente';
        const estadoFacturacionFinal = Estado_Facturacion || 'sin_factura';

        if (!ESTADOS_PAGO_VALIDOS.includes(estadoPagoFinal)) {
            return res.status(400).json({
                error: 'Estado de pago inválido'
            });
        }

        if (!ESTADOS_FACTURACION_VALIDOS.includes(estadoFacturacionFinal)) {
            return res.status(400).json({
                error: 'Estado de facturación inválido'
            });
        }

        const productosUnicos = [...new Set(productos.map(Number))];

        await client.query('BEGIN');

        const clienteExiste = await client.query(
            `
            SELECT Id_Cliente
            FROM Cliente
            WHERE Id_Cliente = $1
            `,
            [Id_Cliente]
        );

        if (clienteExiste.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                error: 'Cliente no encontrado'
            });
        }

        const productosResultado = await client.query(
            `
            SELECT 
                Id_Producto,
                Id_Cliente,
                Precio,
                Cantidad
            FROM Producto
            WHERE Id_Producto = ANY($1::int[])
            `,
            [productosUnicos]
        );

        if (productosResultado.rows.length !== productosUnicos.length) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: 'Uno o más productos seleccionados no existen'
            });
        }

        const productoDeOtroCliente = productosResultado.rows.find(
            producto => Number(producto.id_cliente) !== Number(Id_Cliente)
        );

        if (productoDeOtroCliente) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: 'Uno o más productos no pertenecen al cliente seleccionado'
            });
        }

        const productosYaEnPedido = await client.query(
            `
            SELECT Id_Producto
            FROM Detalle_Pedido
            WHERE Id_Producto = ANY($1::int[])
            `,
            [productosUnicos]
        );

        if (productosYaEnPedido.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: 'Uno o más productos ya pertenecen a otro pedido'
            });
        }

        const precioTotal = productosResultado.rows.reduce((total, producto) => {
            const precio = Number(producto.precio || 0);
            const cantidad = Number(producto.cantidad || 1);

            return total + precio * cantidad;
        }, 0);

        const montoAdeudado = estadoPagoFinal === 'pagado' ? 0 : precioTotal;

        const pedidoResultado = await client.query(
            `
            INSERT INTO Pedido
            (
                Vencimiento,
                Observaciones,
                Precio_Total,
                Estado_Facturacion,
                Nro_Factura,
                Monto_Adeudado,
                Estado_Pago,
                Id_Cliente
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
            `,
            [
                Vencimiento || null,
                Observaciones || null,
                precioTotal,
                estadoFacturacionFinal,
                Nro_Factura || null,
                montoAdeudado,
                estadoPagoFinal,
                Id_Cliente
            ]
        );

        const pedidoCreado = pedidoResultado.rows[0];

        for (const idProducto of productosUnicos) {
            await client.query(
                `
                INSERT INTO Detalle_Pedido
                (Id_Pedido, Id_Producto)
                VALUES ($1, $2)
                `,
                [pedidoCreado.id_pedido, idProducto]
            );
        }

        await client.query('COMMIT');

        res.status(201).json({
            mensaje: 'Pedido creado correctamente',
            pedido: pedidoCreado
        });
    } catch (error) {
        await client.query('ROLLBACK');

        console.error('Error en crearPedido:', error.message);

        res.status(500).json({
            error: 'Error al crear pedido',
            detalle: error.message
        });
    } finally {
        client.release();
    }
};

const cambiarEstadoProducto = async (req, res) => {
    try {
        const { idProducto } = req.params;
        const { Estado } = req.body;

        if (!Estado) {
            return res.status(400).json({
                error: 'Debe indicar el estado'
            });
        }

        if (!ESTADOS_PRODUCTO_VALIDOS.includes(Estado)) {
            return res.status(400).json({
                error: 'Estado inválido'
            });
        }

        const resultado = await pool.query(
            `
            UPDATE Producto
            SET Estado = $1
            WHERE Id_Producto = $2
            RETURNING *
            `,
            [Estado, idProducto]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                error: 'Producto no encontrado'
            });
        }

        res.json({
            mensaje: 'Estado actualizado correctamente',
            producto: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error en cambiarEstadoProducto:', error.message);
        res.status(500).json({
            error: 'Error al cambiar estado del producto',
            detalle: error.message
        });
    }
};

const obtenerProduccion = async (req, res) => {
    try {
        const { estado } = req.query;
        const estadoFiltro = estado || 'en_produccion';

        if (!ESTADOS_PRODUCTO_VALIDOS.includes(estadoFiltro)) {
            return res.status(400).json({
                error: 'Estado inválido'
            });
        }

        const resultado = await pool.query(
            `
            SELECT 
                pr.Id_Producto,
                pr.Modelo,
                pr.Tela,
                pr.Color_Lustre,
                pr.Estado,
                pr.Fecha_Pedido,
                pr.Cantidad,
                pr.Precio,

                p.Id_Pedido,
                p.Fecha_Generacion,
                p.Vencimiento,

                c.Id_Cliente,
                c.Nombre,
                c.Apellido,
                c.Razon_Social
            FROM Producto pr
            JOIN Detalle_Pedido dp ON dp.Id_Producto = pr.Id_Producto
            JOIN Pedido p ON p.Id_Pedido = dp.Id_Pedido
            JOIN Cliente c ON c.Id_Cliente = p.Id_Cliente
            WHERE pr.Estado = $1
            ORDER BY pr.Id_Producto DESC
            `,
            [estadoFiltro]
        );

        res.json(resultado.rows);
    } catch (error) {
        console.error('Error en obtenerProduccion:', error.message);
        res.status(500).json({
            error: 'Error al obtener producción',
            detalle: error.message
        });
    }
};

module.exports = {
    obtenerPedidos,
    obtenerPedidoPorId,
    obtenerProductosDisponiblesPorCliente,
    crearPedido,
    cambiarEstadoProducto,
    obtenerProduccion
};