const db = require("../config/db");


// =====================================================
// CONSTRUIR CONSULTA BASE DEL HISTORIAL
// =====================================================

const construirConsultaMovimientos = ({
    tipo,
    idProveedor,
    fechaDesde,
    fechaHasta
}) => {

    const condiciones = [];
    const valores = [];

    if (tipo) {

        valores.push(tipo);

        condiciones.push(
            `movimientos.tipo_movimiento = $${valores.length}`
        );

    }

    if (idProveedor) {

        valores.push(idProveedor);

        condiciones.push(
            `movimientos.id_proveedor = $${valores.length}`
        );

    }

    if (fechaDesde) {

        valores.push(fechaDesde);

        condiciones.push(
            `movimientos.fecha_movimiento >= $${valores.length}`
        );

    }

    if (fechaHasta) {

        valores.push(fechaHasta);

        condiciones.push(
            `movimientos.fecha_movimiento <= $${valores.length}`
        );

    }

    const where = condiciones.length > 0
        ? `WHERE ${condiciones.join(" AND ")}`
        : "";

    const consulta = `
        WITH movimientos AS (

            -- ==========================================
            -- FACTURAS DE PROVEEDORES
            -- ==========================================

            SELECT
                'factura'::text AS tipo_movimiento,

                fp.Id_Factura_Proveedor
                    AS id_movimiento,

                fp.Fecha_Emision
                    AS fecha_movimiento,

                fp.Id_Proveedor
                    AS id_proveedor,

                COALESCE(
                    NULLIF(TRIM(p.Razon_Social), ''),
                    CONCAT_WS(
                        ' ',
                        p.Nombre,
                        p.Apellido
                    )
                ) AS proveedor,

                fp.Precio_Total
                    AS monto,

                fp.Precio_Total
                    AS impacto_saldo,

                fp.Estado_Pago::text
                    AS estado_pago,

                fp.Nro_Factura_Proveedor::text
                    AS referencia,

                fp.Observaciones
                    AS observaciones,

                NULL::integer
                    AS id_medio_pago

            FROM Factura_Proveedor fp

            INNER JOIN Proveedor p
                ON p.Id_Proveedor = fp.Id_Proveedor


            UNION ALL


            -- ==========================================
            -- PAGOS A PROVEEDORES
            -- ==========================================

            SELECT
                'pago'::text AS tipo_movimiento,

                pi.Id_Pago_Insumo
                    AS id_movimiento,

                pi.Fecha_Pago
                    AS fecha_movimiento,

                fp.Id_Proveedor
                    AS id_proveedor,

                COALESCE(
                    NULLIF(TRIM(p.Razon_Social), ''),
                    CONCAT_WS(
                        ' ',
                        p.Nombre,
                        p.Apellido
                    )
                ) AS proveedor,

                SUM(dpc.Monto_Usado)
                    AS monto,

                SUM(dpc.Monto_Usado) * -1
                    AS impacto_saldo,

                pi.Estado_Pago::text
                    AS estado_pago,

                STRING_AGG(
                    DISTINCT fp.Nro_Factura_Proveedor::text,
                    ', '
                ) AS referencia,

                NULL::text
                    AS observaciones,

                pi.Id_Medio_Pago
                    AS id_medio_pago

            FROM Pago_Insumo pi

            INNER JOIN Detalle_Pago_Compra dpc
                ON dpc.Id_Pago_Insumo =
                   pi.Id_Pago_Insumo

            INNER JOIN Factura_Proveedor fp
                ON fp.Id_Factura_Proveedor =
                   dpc.Id_Factura_Proveedor

            INNER JOIN Proveedor p
                ON p.Id_Proveedor =
                   fp.Id_Proveedor

            GROUP BY
                pi.Id_Pago_Insumo,
                pi.Fecha_Pago,
                pi.Estado_Pago,
                pi.Id_Medio_Pago,
                fp.Id_Proveedor,
                p.Id_Proveedor,
                p.Razon_Social,
                p.Nombre,
                p.Apellido
        )

        SELECT
            tipo_movimiento,
            id_movimiento,
            fecha_movimiento,
            id_proveedor,
            proveedor,
            monto,
            impacto_saldo,
            estado_pago,
            referencia,
            observaciones,
            id_medio_pago

        FROM movimientos

        ${where}

        ORDER BY
            fecha_movimiento DESC,
            id_movimiento DESC
    `;

    return {
        consulta,
        valores
    };

};


// =====================================================
// OBTENER TODOS LOS MOVIMIENTOS
// =====================================================

const obtenerMovimientos = async (req, res) => {

    try {

        const {
            tipo,
            proveedor,
            desde,
            hasta
        } = req.query;

        if (
            tipo &&
            tipo !== "factura" &&
            tipo !== "pago"
        ) {

            return res.status(400).json({
                mensaje:
                    "El tipo de movimiento debe ser factura o pago."
            });

        }

        if (
            proveedor &&
            !Number.isInteger(Number(proveedor))
        ) {

            return res.status(400).json({
                mensaje:
                    "El identificador del proveedor no es válido."
            });

        }

        const {
            consulta,
            valores
        } = construirConsultaMovimientos({
            tipo,
            idProveedor: proveedor,
            fechaDesde: desde,
            fechaHasta: hasta
        });

        const resultado = await db.query(
            consulta,
            valores
        );

        res.json(resultado.rows);

    } catch (error) {

        console.error(
            "Error al obtener el historial de movimientos:",
            error
        );

        res.status(500).json({
            mensaje:
                "Error al obtener el historial de movimientos."
        });

    }

};


// =====================================================
// OBTENER MOVIMIENTOS DE UN PROVEEDOR
// =====================================================

const obtenerMovimientosProveedor = async (req, res) => {

    const { id } = req.params;

    try {

        if (!Number.isInteger(Number(id))) {

            return res.status(400).json({
                mensaje:
                    "El identificador del proveedor no es válido."
            });

        }

        const proveedorExiste = await db.query(
            `
            SELECT
                Id_Proveedor,
                Nombre,
                Apellido,
                Razon_Social,
                Saldo

            FROM Proveedor

            WHERE Id_Proveedor = $1
            `,
            [id]
        );

        if (proveedorExiste.rows.length === 0) {

            return res.status(404).json({
                mensaje: "El proveedor no existe."
            });

        }

        const {
            consulta,
            valores
        } = construirConsultaMovimientos({
            idProveedor: id
        });

        const movimientos = await db.query(
            consulta,
            valores
        );

        const resumenQuery = await db.query(
            `
            SELECT
                COALESCE(
                    (SELECT SUM(Precio_Total)
                     FROM Factura_Proveedor
                     WHERE Id_Proveedor = $1),
                    0
                ) AS total_facturado,

                COALESCE(
                    (SELECT SUM(dpc.Monto_Usado)
                     FROM Detalle_Pago_Compra dpc
                     JOIN Factura_Proveedor fp ON fp.Id_Factura_Proveedor = dpc.Id_Factura_Proveedor
                     WHERE fp.Id_Proveedor = $1),
                    0
                ) AS total_pagado,

                COALESCE(
                    (SELECT SUM(Monto_Adeudado)
                     FROM Factura_Proveedor
                     WHERE Id_Proveedor = $1 AND Estado_Pago <> 'pagado'),
                    0
                ) AS saldo_pendiente,

                COALESCE(
                    (SELECT SUM(Monto_Restante)
                     FROM Pago_Insumo
                     WHERE Id_Pago_Insumo IN (
                         SELECT DISTINCT dpc.Id_Pago_Insumo
                         FROM Detalle_Pago_Compra dpc
                         JOIN Factura_Proveedor fp ON fp.Id_Factura_Proveedor = dpc.Id_Factura_Proveedor
                         WHERE fp.Id_Proveedor = $1
                     )),
                    0
                ) AS saldo_a_favor,

                (SELECT COUNT(*) FROM Factura_Proveedor WHERE Id_Proveedor = $1) AS cantidad_facturas,

                (SELECT COUNT(DISTINCT dpc.Id_Pago_Insumo)
                 FROM Detalle_Pago_Compra dpc
                 JOIN Factura_Proveedor fp ON fp.Id_Factura_Proveedor = dpc.Id_Factura_Proveedor
                 WHERE fp.Id_Proveedor = $1) AS cantidad_pagos
            `,
            [id]
        );

        res.json({
            proveedor: proveedorExiste.rows[0],
            resumen: resumenQuery.rows[0] || {
                total_facturado: 0,
                total_pagado: 0,
                saldo_pendiente: 0,
                saldo_a_favor: 0,
                cantidad_facturas: 0,
                cantidad_pagos: 0
            },
            movimientos: movimientos.rows
        });

    } catch (error) {

        console.error(
            "Error al obtener los movimientos del proveedor:",
            error
        );

        res.status(500).json({
            mensaje:
                "Error al obtener los movimientos del proveedor."
        });

    }

};


// =====================================================
// OBTENER MOVIMIENTOS DE UN CLIENTE
// =====================================================

const obtenerMovimientosCliente = async (req, res) => {

    const { id } = req.params;

    try {

        if (!Number.isInteger(Number(id))) {

            return res.status(400).json({
                mensaje: "El identificador del cliente no es válido."
            });

        }

        const clienteExiste = await db.query(
            `
            SELECT
                Id_Cliente,
                Nombre,
                Apellido,
                Razon_Social,
                CUIT_CUIL,
                Telefono,
                Email,
                Saldo

            FROM Cliente

            WHERE Id_Cliente = $1
            `,
            [id]
        );

        if (clienteExiste.rows.length === 0) {

            return res.status(404).json({
                mensaje: "El cliente no existe."
            });

        }

        const resumenQuery = await db.query(
            `
            SELECT
                COALESCE(
                    (SELECT SUM(Precio_Total)
                     FROM Pedido
                     WHERE Id_Cliente = $1),
                    0
                ) AS total_facturado,

                COALESCE(
                    (SELECT SUM(dpp.Monto_Usado)
                     FROM Detalle_Pago_Pedido dpp
                     JOIN Pedido p ON p.Id_Pedido = dpp.Id_Pedido
                     WHERE p.Id_Cliente = $1),
                    0
                ) AS total_pagado,

                COALESCE(
                    (SELECT SUM(Monto_Adeudado)
                     FROM Pedido
                     WHERE Id_Cliente = $1 AND Estado_Pago <> 'pagado'),
                    0
                ) AS saldo_pendiente,

                COALESCE(
                    (SELECT SUM(Monto_Restante)
                     FROM PagoPedido
                     WHERE Id_Pago_Pedido IN (
                         SELECT DISTINCT dpp.Id_Pago_Pedido
                         FROM Detalle_Pago_Pedido dpp
                         JOIN Pedido p ON p.Id_Pedido = dpp.Id_Pedido
                         WHERE p.Id_Cliente = $1
                     )),
                    0
                ) AS saldo_a_favor,

                (SELECT COUNT(*) FROM Pedido WHERE Id_Cliente = $1) AS cantidad_pedidos,

                (SELECT COUNT(DISTINCT dpp.Id_Pago_Pedido)
                 FROM Detalle_Pago_Pedido dpp
                 JOIN Pedido p ON p.Id_Pedido = dpp.Id_Pedido
                 WHERE p.Id_Cliente = $1) AS cantidad_pagos
            `,
            [id]
        );

        const movimientosQuery = await db.query(
            `
            WITH movimientos AS (

                SELECT
                    'pedido'::text AS tipo_movimiento,
                    p.Id_Pedido AS id_movimiento,
                    p.Fecha_Generacion::date AS fecha_movimiento,
                    p.Id_Cliente AS id_cliente,
                    COALESCE(
                        NULLIF(TRIM(c.Razon_Social), ''),
                        CONCAT_WS(' ', c.Nombre, c.Apellido)
                    ) AS cliente,
                    p.Precio_Total AS monto,
                    p.Precio_Total AS impacto_saldo,
                    p.Estado_Pago::text AS estado_pago,
                    CONCAT('Pedido N° ', p.Id_Pedido) AS referencia,
                    p.Observaciones AS observaciones,
                    NULL::integer AS id_medio_pago

                FROM Pedido p

                INNER JOIN Cliente c
                    ON c.Id_Cliente = p.Id_Cliente

                WHERE p.Id_Cliente = $1


                UNION ALL


                SELECT
                    'pago'::text AS tipo_movimiento,
                    pp.Id_Pago_Pedido AS id_movimiento,
                    pp.Fecha_Pago AS fecha_movimiento,
                    p.Id_Cliente AS id_cliente,
                    COALESCE(
                        NULLIF(TRIM(c.Razon_Social), ''),
                        CONCAT_WS(' ', c.Nombre, c.Apellido)
                    ) AS cliente,
                    SUM(dpp.Monto_Usado) AS monto,
                    SUM(dpp.Monto_Usado) * -1 AS impacto_saldo,
                    pp.Estado_Pago::text AS estado_pago,
                    STRING_AGG(
                        DISTINCT CONCAT('Pedido N° ', p.Id_Pedido),
                        ', '
                    ) AS referencia,
                    NULL::text AS observaciones,
                    pp.Id_Medio_Pago AS id_medio_pago

                FROM PagoPedido pp

                INNER JOIN Detalle_Pago_Pedido dpp
                    ON dpp.Id_Pago_Pedido = pp.Id_Pago_Pedido

                INNER JOIN Pedido p
                    ON p.Id_Pedido = dpp.Id_Pedido

                INNER JOIN Cliente c
                    ON c.Id_Cliente = p.Id_Cliente

                WHERE p.Id_Cliente = $1

                GROUP BY
                    pp.Id_Pago_Pedido,
                    pp.Fecha_Pago,
                    pp.Estado_Pago,
                    pp.Id_Medio_Pago,
                    p.Id_Cliente,
                    c.Id_Cliente,
                    c.Razon_Social,
                    c.Nombre,
                    c.Apellido
            )

            SELECT
                tipo_movimiento,
                id_movimiento,
                fecha_movimiento,
                id_cliente,
                cliente,
                monto,
                impacto_saldo,
                estado_pago,
                referencia,
                observaciones,
                id_medio_pago

            FROM movimientos

            ORDER BY
                fecha_movimiento DESC,
                id_movimiento DESC
            `,
            [id]
        );

        res.json({
            cliente: clienteExiste.rows[0],
            resumen: resumenQuery.rows[0] || {
                total_facturado: 0,
                total_pagado: 0,
                saldo_pendiente: 0,
                saldo_a_favor: 0,
                cantidad_pedidos: 0,
                cantidad_pagos: 0
            },
            movimientos: movimientosQuery.rows
        });

    } catch (error) {

        console.error("Error al obtener movimientos del cliente:", error);

        res.status(500).json({
            mensaje: "Error al obtener los movimientos del cliente."
        });

    }

};


// =====================================================
// OBTENER RESUMEN GENERAL DE MOVIMIENTOS
// =====================================================

const obtenerResumenMovimientos = async (req, res) => {

    try {

        const resultado = await db.query(`
            SELECT
                COALESCE(
                    (
                        SELECT SUM(Precio_Total)
                        FROM Factura_Proveedor
                    ),
                    0
                ) AS total_facturado,

                COALESCE(
                    (
                        SELECT SUM(Monto_Usado)
                        FROM Detalle_Pago_Compra
                    ),
                    0
                ) AS total_pagado,

                COALESCE(
                    (
                        SELECT SUM(Monto_Adeudado)
                        FROM Factura_Proveedor
                    ),
                    0
                ) AS total_adeudado,

                (
                    SELECT COUNT(*)
                    FROM Factura_Proveedor
                ) AS cantidad_facturas,

                (
                    SELECT COUNT(*)
                    FROM Pago_Insumo
                ) AS cantidad_pagos,

                (
                    SELECT COUNT(*)
                    FROM Factura_Proveedor
                    WHERE Estado_Pago = 'pendiente'
                ) AS facturas_pendientes,

                (
                    SELECT COUNT(*)
                    FROM Factura_Proveedor
                    WHERE Estado_Pago = 'parcial'
                ) AS facturas_parciales,

                (
                    SELECT COUNT(*)
                    FROM Factura_Proveedor
                    WHERE Estado_Pago = 'pagado'
                ) AS facturas_pagadas
        `);

        res.json(resultado.rows[0]);

    } catch (error) {

        console.error(
            "Error al obtener el resumen de movimientos:",
            error
        );

        res.status(500).json({
            mensaje:
                "Error al obtener el resumen de movimientos."
        });

    }

};


// =====================================================
// OBTENER UN MOVIMIENTO POR TIPO E ID
// =====================================================

const obtenerMovimientoPorId = async (req, res) => {

    const {
        tipo,
        id
    } = req.params;

    try {

        if (
            tipo !== "factura" &&
            tipo !== "pago"
        ) {

            return res.status(400).json({
                mensaje:
                    "El tipo de movimiento debe ser factura o pago."
            });

        }

        if (!Number.isInteger(Number(id))) {

            return res.status(400).json({
                mensaje:
                    "El identificador del movimiento no es válido."
            });

        }

        const {
            consulta,
            valores
        } = construirConsultaMovimientos({
            tipo
        });

        const consultaMovimiento = `
            SELECT *

            FROM (
                ${consulta.replace(
                    /ORDER BY[\s\S]*$/i,
                    ""
                )}
            ) AS historial

            WHERE historial.id_movimiento =
                  $${valores.length + 1}
        `;

        const resultado = await db.query(
            consultaMovimiento,
            [
                ...valores,
                id
            ]
        );

        if (resultado.rows.length === 0) {

            return res.status(404).json({
                mensaje:
                    "No se encontró el movimiento solicitado."
            });

        }

        res.json(resultado.rows[0]);

    } catch (error) {

        console.error(
            "Error al obtener el movimiento:",
            error
        );

        res.status(500).json({
            mensaje:
                "Error al obtener el movimiento."
        });

    }

};


// =====================================================
// EXPORTAR FUNCIONES
// =====================================================

module.exports = {
    obtenerMovimientos,
    obtenerMovimientosProveedor,
    obtenerMovimientosCliente,
    obtenerResumenMovimientos,
    obtenerMovimientoPorId
};