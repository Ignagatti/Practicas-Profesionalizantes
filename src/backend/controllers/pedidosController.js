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
                CASE 
                    WHEN p.Factura IS NOT NULL THEN 'http://localhost:4000/api/pedidos/' || p.Id_Pedido || '/factura/pdf'
                    ELSE NULL 
                END AS pdf_factura_url,
                CASE 
                    WHEN p.Factura IS NOT NULL THEN COALESCE(p.Nro_Factura, 'factura') || '.pdf'
                    ELSE NULL 
                END AS pdf_factura_nombre,

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
                CASE 
                    WHEN p.Factura IS NOT NULL THEN 'http://localhost:4000/api/pedidos/' || p.Id_Pedido || '/factura/pdf'
                    ELSE NULL 
                END AS pdf_factura_url,
                CASE 
                    WHEN p.Factura IS NOT NULL THEN COALESCE(p.Nro_Factura, 'factura') || '.pdf'
                    ELSE NULL 
                END AS pdf_factura_nombre,

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

const actualizarPedido = async (req, res) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;
        const {
            Vencimiento,
            Observaciones,
            Estado_Pago,
            Estado_Facturacion,
            Nro_Factura,
            Monto_Adeudado,
            productos
        } = req.body;

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

        // Verificar que el pedido existe y obtener su cliente
        const pedidoExiste = await client.query(
            `
            SELECT Id_Pedido, Id_Cliente
            FROM Pedido
            WHERE Id_Pedido = $1
            `,
            [id]
        );

        if (pedidoExiste.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                error: 'Pedido no encontrado'
            });
        }

        const idCliente = pedidoExiste.rows[0].id_cliente;

        // Verificar que los productos existen y pertenecen al cliente
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
            producto => Number(producto.id_cliente) !== Number(idCliente)
        );

        if (productoDeOtroCliente) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: 'Uno o más productos no pertenecen al cliente de este pedido'
            });
        }

        // Verificar que los productos no estén asociados a OTRO pedido
        const productosYaEnOtroPedido = await client.query(
            `
            SELECT Id_Producto
            FROM Detalle_Pedido
            WHERE Id_Producto = ANY($1::int[]) AND Id_Pedido <> $2
            `,
            [productosUnicos, id]
        );

        if (productosYaEnOtroPedido.rows.length > 0) {
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

        let montoAdeudadoFinal = Monto_Adeudado !== undefined ? Number(Monto_Adeudado) : precioTotal;
        if (estadoPagoFinal === 'pagado') {
            montoAdeudadoFinal = 0;
        }

        // Actualizar el Pedido
        const pedidoResultado = await client.query(
            `
            UPDATE Pedido
            SET 
                Vencimiento = $1,
                Observaciones = $2,
                Precio_Total = $3,
                Estado_Facturacion = $4,
                Nro_Factura = $5,
                Monto_Adeudado = $6,
                Estado_Pago = $7
            WHERE Id_Pedido = $8
            RETURNING *
            `,
            [
                Vencimiento || null,
                Observaciones || null,
                precioTotal,
                estadoFacturacionFinal,
                Nro_Factura || null,
                montoAdeudadoFinal,
                estadoPagoFinal,
                id
            ]
        );

        // Eliminar detalles anteriores
        await client.query(
            `
            DELETE FROM Detalle_Pedido
            WHERE Id_Pedido = $1
            `,
            [id]
        );

        // Insertar nuevos detalles
        for (const idProducto of productosUnicos) {
            await client.query(
                `
                INSERT INTO Detalle_Pedido (Id_Pedido, Id_Producto)
                VALUES ($1, $2)
                `,
                [id, idProducto]
            );
        }

        await client.query('COMMIT');

        res.json({
            mensaje: 'Pedido actualizado correctamente',
            pedido: pedidoResultado.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en actualizarPedido:', error.message);
        res.status(500).json({
            error: 'Error al actualizar pedido',
            detalle: error.message
        });
    } finally {
        client.release();
    }
};

const subirFactura = async (req, res) => {
    try {
        const { id } = req.params;
        const { Estado_Facturacion, Nro_Factura } = req.body;
        const archivo = req.file;

        if (!Estado_Facturacion) {
            return res.status(400).json({ error: "Faltan datos obligatorios." });
        }

        const pedidoExiste = await pool.query(
            "SELECT Id_Pedido FROM Pedido WHERE Id_Pedido = $1",
            [id]
        );

        if (pedidoExiste.rows.length === 0) {
            return res.status(404).json({ error: "Pedido no encontrado" });
        }

        let query = "";
        let params = [];

        if (archivo) {
            query = `
                UPDATE Pedido
                SET 
                    Estado_Facturacion = $1,
                    Nro_Factura = $2,
                    Factura = $3
                WHERE Id_Pedido = $4
                RETURNING *
            `;
            params = [Estado_Facturacion, Nro_Factura || null, archivo.buffer, id];
        } else {
            query = `
                UPDATE Pedido
                SET 
                    Estado_Facturacion = $1,
                    Nro_Factura = $2
                WHERE Id_Pedido = $3
                RETURNING *
            `;
            params = [Estado_Facturacion, Nro_Factura || null, id];
        }

        const resultado = await pool.query(query, params);

        res.json({
            mensaje: "Factura guardada correctamente",
            pedido: resultado.rows[0]
        });
    } catch (error) {
        console.error("Error en subirFactura:", error.message);
        res.status(500).json({
            error: "Error al subir la factura",
            detalle: error.message
        });
    }
};

const descargarPdfFactura = async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await pool.query(
            "SELECT Factura, Nro_Factura FROM Pedido WHERE Id_Pedido = $1",
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).send("Pedido no encontrado");
        }

        const pedido = resultado.rows[0];

        if (!pedido.factura) {
            return res.status(404).send("Este pedido no tiene un PDF de factura registrado");
        }

        const filename = pedido.nro_factura ? `factura_${pedido.nro_factura}.pdf` : `factura_${id}.pdf`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
        res.send(pedido.factura);
    } catch (error) {
        console.error("Error en descargarPdfFactura:", error.message);
        res.status(500).send("Error al descargar el PDF");
    }
};

const eliminarPdfFactura = async (req, res) => {
    try {
        const { id } = req.params;

        const pedidoExiste = await pool.query(
            "SELECT Id_Pedido FROM Pedido WHERE Id_Pedido = $1",
            [id]
        );

        if (pedidoExiste.rows.length === 0) {
            return res.status(404).json({ error: "Pedido no encontrado" });
        }

        const resultado = await pool.query(
            `
            UPDATE Pedido
            SET Factura = NULL
            WHERE Id_Pedido = $1
            RETURNING *
            `,
            [id]
        );

        res.json({
            mensaje: "PDF de factura eliminado correctamente",
            pedido: resultado.rows[0]
        });
    } catch (error) {
        console.error("Error en eliminarPdfFactura:", error.message);
        res.status(500).json({
            error: "Error al eliminar el PDF de la factura",
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
    obtenerProduccion,
    actualizarPedido,
    subirFactura,
    descargarPdfFactura,
    eliminarPdfFactura
};