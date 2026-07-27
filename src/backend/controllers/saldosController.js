const db = require("../config/db");


// =====================================================
// OBTENER SALDOS DE TODOS LOS PROVEEDORES
// =====================================================

const obtenerSaldosProveedores = async (req, res) => {

    try {

        const resultado = await db.query(`
            SELECT
                p.Id_Proveedor,
                p.Nombre,
                p.Apellido,
                p.Razon_Social,
                p.Saldo AS saldo_guardado,

                COALESCE(
                    SUM(fp.Monto_Adeudado),
                    0
                ) AS saldo_calculado,

                COUNT(fp.Id_Factura_Proveedor)
                    FILTER (
                        WHERE fp.Estado_Pago <> 'pagado'
                    ) AS cantidad_facturas_pendientes

            FROM Proveedor p

            LEFT JOIN Factura_Proveedor fp
                ON p.Id_Proveedor = fp.Id_Proveedor

            GROUP BY
                p.Id_Proveedor,
                p.Nombre,
                p.Apellido,
                p.Razon_Social,
                p.Saldo

            ORDER BY
                COALESCE(SUM(fp.Monto_Adeudado), 0) DESC,
                p.Razon_Social ASC,
                p.Nombre ASC
        `);

        res.json(resultado.rows);

    } catch (error) {

        console.error("Error al obtener saldos:", error);

        res.status(500).json({
            mensaje: "Error al obtener los saldos de los proveedores."
        });

    }

};


// =====================================================
// OBTENER SALDO DE UN PROVEEDOR
// =====================================================

const obtenerSaldoProveedor = async (req, res) => {

    const { id } = req.params;

    try {

        const proveedor = await db.query(
            `
            SELECT
                p.Id_Proveedor,
                p.Nombre,
                p.Apellido,
                p.Razon_Social,
                p.Saldo AS saldo_guardado,

                COALESCE(
                    SUM(fp.Monto_Adeudado),
                    0
                ) AS saldo_calculado,

                COUNT(fp.Id_Factura_Proveedor)
                    FILTER (
                        WHERE fp.Estado_Pago <> 'pagado'
                    ) AS cantidad_facturas_pendientes

            FROM Proveedor p

            LEFT JOIN Factura_Proveedor fp
                ON p.Id_Proveedor = fp.Id_Proveedor

            WHERE p.Id_Proveedor = $1

            GROUP BY
                p.Id_Proveedor,
                p.Nombre,
                p.Apellido,
                p.Razon_Social,
                p.Saldo
            `,
            [id]
        );

        if (proveedor.rows.length === 0) {

            return res.status(404).json({
                mensaje: "El proveedor no existe."
            });

        }

        const facturas = await db.query(
            `
            SELECT
                Id_Factura_Proveedor,
                Nro_Factura_Proveedor,
                Fecha_Emision,
                Vencimiento,
                Precio_Total,
                Monto_Adeudado,
                Estado_Pago,
                Observaciones

            FROM Factura_Proveedor

            WHERE Id_Proveedor = $1

            ORDER BY Fecha_Emision DESC
            `,
            [id]
        );

        res.json({
            proveedor: proveedor.rows[0],
            facturas: facturas.rows
        });

    } catch (error) {

        console.error("Error al obtener saldo del proveedor:", error);

        res.status(500).json({
            mensaje: "Error al obtener el saldo del proveedor."
        });

    }

};


// =====================================================
// RECALCULAR SALDO DE UN PROVEEDOR
// =====================================================

const recalcularSaldoProveedor = async (req, res) => {

    const { id } = req.params;

    const client = await db.connect();

    try {

        await client.query("BEGIN");

        const proveedor = await client.query(
            `
            SELECT *
            FROM Proveedor
            WHERE Id_Proveedor = $1
            FOR UPDATE
            `,
            [id]
        );

        if (proveedor.rows.length === 0) {

            await client.query("ROLLBACK");

            return res.status(404).json({
                mensaje: "El proveedor no existe."
            });

        }

        const resultadoSaldo = await client.query(
            `
            SELECT
                COALESCE(
                    SUM(Monto_Adeudado),
                    0
                ) AS saldo_calculado

            FROM Factura_Proveedor

            WHERE Id_Proveedor = $1
            `,
            [id]
        );

        const saldoCalculado = Number(
            resultadoSaldo.rows[0].saldo_calculado
        );

        const proveedorActualizado = await client.query(
            `
            UPDATE Proveedor

            SET Saldo = $1

            WHERE Id_Proveedor = $2

            RETURNING
                Id_Proveedor,
                Nombre,
                Apellido,
                Razon_Social,
                Saldo
            `,
            [
                saldoCalculado,
                id
            ]
        );

        await client.query("COMMIT");

        res.json({
            mensaje: "Saldo del proveedor recalculado correctamente.",
            proveedor: proveedorActualizado.rows[0]
        });

    } catch (error) {

        await client.query("ROLLBACK");

        console.error("Error al recalcular saldo:", error);

        res.status(500).json({
            mensaje: "Error al recalcular el saldo del proveedor."
        });

    } finally {

        client.release();

    }

};


// =====================================================
// RECALCULAR SALDOS DE TODOS LOS PROVEEDORES
// =====================================================

const recalcularTodosLosSaldos = async (req, res) => {

    const client = await db.connect();

    try {

        await client.query("BEGIN");

        const resultado = await client.query(`
            UPDATE Proveedor p

            SET Saldo = (
                SELECT
                    COALESCE(
                        SUM(fp.Monto_Adeudado),
                        0
                    )

                FROM Factura_Proveedor fp

                WHERE fp.Id_Proveedor = p.Id_Proveedor
            )

            RETURNING
                p.Id_Proveedor,
                p.Nombre,
                p.Apellido,
                p.Razon_Social,
                p.Saldo
        `);

        await client.query("COMMIT");

        res.json({
            mensaje: "Todos los saldos fueron recalculados correctamente.",
            proveedores_actualizados: resultado.rows.length,
            proveedores: resultado.rows
        });

    } catch (error) {

        await client.query("ROLLBACK");

        console.error("Error al recalcular todos los saldos:", error);

        res.status(500).json({
            mensaje: "Error al recalcular los saldos."
        });

    } finally {

        client.release();

    }

};


// =====================================================
// EXPORTAR FUNCIONES
// =====================================================

module.exports = {

    obtenerSaldosProveedores,
    obtenerSaldoProveedor,
    recalcularSaldoProveedor,
    recalcularTodosLosSaldos

};