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

        res.json({
            proveedor: proveedorExiste.rows[0],
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
    obtenerResumenMovimientos,
    obtenerMovimientoPorId
};