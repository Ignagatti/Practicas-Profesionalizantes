const db = require("../config/db");


// =====================================================
// OBTENER TODAS LAS FACTURAS CON SU ESTADO DE PAGO
// =====================================================

const obtenerEstadosPago = async (req, res) => {

    try {

        const resultado = await db.query(`
            SELECT
                fp.Id_Factura_Proveedor,
                fp.Nro_Factura_Proveedor,
                fp.Precio_Total,
                fp.Monto_Adeudado,
                fp.Estado_Pago,
                fp.Fecha_Emision,
                fp.Vencimiento,

                p.Id_Proveedor,
                p.Nombre,
                p.Apellido,
                p.Razon_Social

            FROM Factura_Proveedor fp

            INNER JOIN Proveedor p
                ON fp.Id_Proveedor = p.Id_Proveedor

            ORDER BY fp.Id_Factura_Proveedor DESC
        `);

        res.json(resultado.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error al obtener los estados de pago."
        });

    }

};


// =====================================================
// OBTENER FACTURAS PENDIENTES
// =====================================================

const obtenerFacturasPendientes = async (req, res) => {

    try {

        const resultado = await db.query(`
            SELECT
                fp.*,

                p.Nombre,
                p.Apellido,
                p.Razon_Social

            FROM Factura_Proveedor fp

            INNER JOIN Proveedor p
                ON fp.Id_Proveedor = p.Id_Proveedor

            WHERE fp.Estado_Pago = 'pendiente'

            ORDER BY fp.Vencimiento ASC
        `);

        res.json(resultado.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error al obtener las facturas pendientes."
        });

    }

};


// =====================================================
// OBTENER FACTURAS PARCIALMENTE PAGADAS
// =====================================================

const obtenerFacturasParciales = async (req, res) => {

    try {

        const resultado = await db.query(`
            SELECT
                fp.*,

                p.Nombre,
                p.Apellido,
                p.Razon_Social

            FROM Factura_Proveedor fp

            INNER JOIN Proveedor p
                ON fp.Id_Proveedor = p.Id_Proveedor

            WHERE fp.Estado_Pago = 'parcial'

            ORDER BY fp.Vencimiento ASC
        `);

        res.json(resultado.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error al obtener las facturas parcialmente pagadas."
        });

    }

};


// =====================================================
// OBTENER FACTURAS PAGADAS
// =====================================================

const obtenerFacturasPagadas = async (req, res) => {

    try {

        const resultado = await db.query(`
            SELECT
                fp.*,

                p.Nombre,
                p.Apellido,
                p.Razon_Social

            FROM Factura_Proveedor fp

            INNER JOIN Proveedor p
                ON fp.Id_Proveedor = p.Id_Proveedor

            WHERE fp.Estado_Pago = 'pagado'

            ORDER BY fp.Fecha_Emision DESC
        `);

        res.json(resultado.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error al obtener las facturas pagadas."
        });

    }

};


// =====================================================
// OBTENER ESTADO DE CUENTA DE UN PROVEEDOR
// =====================================================

const obtenerEstadoPagoProveedor = async (req, res) => {

    const { id } = req.params;

    try {

        const resultado = await db.query(
            `
            SELECT
                fp.Id_Factura_Proveedor,
                fp.Nro_Factura_Proveedor,
                fp.Precio_Total,
                fp.Monto_Adeudado,
                fp.Estado_Pago,
                fp.Fecha_Emision,
                fp.Vencimiento,
                fp.Observaciones

            FROM Factura_Proveedor fp

            WHERE fp.Id_Proveedor = $1

            ORDER BY fp.Fecha_Emision DESC
            `,
            [id]
        );

        res.json(resultado.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error al obtener el estado de cuenta del proveedor."
        });

    }

};


module.exports = {

    obtenerEstadosPago,
    obtenerFacturasPendientes,
    obtenerFacturasParciales,
    obtenerFacturasPagadas,
    obtenerEstadoPagoProveedor

};