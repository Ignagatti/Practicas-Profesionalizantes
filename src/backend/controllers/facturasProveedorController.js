const db = require("../config/db");
const {
    parseMoney,
    roundMoney,
    addMoney,
    subMoney
} = require("../utils/currencyUtils");

// Obtener todas las facturas
const obtenerFacturas = async (req, res) => {
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
            ORDER BY fp.Id_Factura_Proveedor DESC
        `);

        res.json(resultado.rows);
    } catch (error) {
        console.error("Error en obtenerFacturas:", error);
        res.status(500).json({
            mensaje: "Error al obtener las facturas."
        });
    }
};

// Obtener una factura por ID
const obtenerFacturaPorId = async (req, res) => {
    const { id } = req.params;

    try {
        const resultado = await db.query(
            `SELECT *
             FROM Factura_Proveedor
             WHERE Id_Factura_Proveedor = $1`,
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Factura inexistente."
            });
        }

        res.json(resultado.rows[0]);
    } catch (error) {
        console.error("Error en obtenerFacturaPorId:", error);
        res.status(500).json({
            mensaje: "Error del servidor."
        });
    }
};

// Crear factura
const crearFactura = async (req, res) => {
    const client = await db.connect();

    try {
        const {
            Precio_Total,
            Vencimiento,
            Observaciones,
            Fecha_Emision,
            Nro_Factura_Proveedor,
            Id_Proveedor,
            tipo_comprobante
        } = req.body;

        const precioTotal = roundMoney(parseMoney(Precio_Total));
        const archivo_pdf = req.file ? `/uploads/${req.file.filename}` : null;
        const tipoComp = tipo_comprobante || 'factura';

        // Validaciones
        if (!Precio_Total || !Fecha_Emision || !Id_Proveedor) {
            return res.status(400).json({
                mensaje: "Faltan datos obligatorios."
            });
        }

        if (precioTotal <= 0) {
            return res.status(400).json({
                mensaje: "El precio debe ser mayor que cero."
            });
        }

        if (tipoComp === 'factura' && (!Nro_Factura_Proveedor || !Nro_Factura_Proveedor.trim())) {
            return res.status(400).json({
                mensaje: "El número de factura es obligatorio para los comprobantes tipo factura."
            });
        }

        await client.query("BEGIN");

        // Bloqueo y verificación de proveedor
        const proveedor = await client.query(
            `
            SELECT *
            FROM Proveedor
            WHERE Id_Proveedor = $1
            FOR UPDATE
            `,
            [Id_Proveedor]
        );

        if (proveedor.rows.length === 0) {
            throw new Error("El proveedor no existe.");
        }

        // Crear la factura
        const factura = await client.query(
            `
            INSERT INTO Factura_Proveedor
            (
                Precio_Total,
                Vencimiento,
                Observaciones,
                Fecha_Emision,
                Monto_Adeudado,
                Estado_Pago,
                Nro_Factura_Proveedor,
                Id_Proveedor,
                tipo_comprobante,
                archivo_pdf
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                $1,
                'pendiente',
                $5,
                $6,
                $7,
                $8
            )
            RETURNING *
            `,
            [
                precioTotal,
                Vencimiento || null,
                Observaciones || null,
                Fecha_Emision,
                Nro_Factura_Proveedor || null,
                Id_Proveedor,
                tipoComp,
                archivo_pdf
            ]
        );

        // Actualizar saldo del proveedor (aumenta la deuda)
        await client.query(
            `
            UPDATE Proveedor
            SET Saldo = Saldo + $1
            WHERE Id_Proveedor = $2
            `,
            [
                precioTotal,
                Id_Proveedor
            ]
        );

        await client.query("COMMIT");

        res.status(201).json({
            mensaje: "Factura creada correctamente.",
            factura: factura.rows[0]
        });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error en crearFactura:", error);
        res.status(500).json({
            mensaje: "Error al crear la factura.",
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Editar factura
const editarFactura = async (req, res) => {
    const client = await db.connect();

    try {
        const { id } = req.params;
        const {
            Precio_Total,
            Vencimiento,
            Observaciones,
            Fecha_Emision,
            Nro_Factura_Proveedor,
            tipo_comprobante
        } = req.body;

        const nuevoPrecioTotal = roundMoney(parseMoney(Precio_Total));
        const tipoComp = tipo_comprobante || 'factura';

        // Validaciones
        if (!Precio_Total || !Fecha_Emision) {
            return res.status(400).json({
                mensaje: "Faltan datos obligatorios."
            });
        }

        if (nuevoPrecioTotal <= 0) {
            return res.status(400).json({
                mensaje: "El precio debe ser mayor que cero."
            });
        }

        if (tipoComp === 'factura' && (!Nro_Factura_Proveedor || !Nro_Factura_Proveedor.trim())) {
            return res.status(400).json({
                mensaje: "El número de factura es obligatorio para los comprobantes tipo factura."
            });
        }

        await client.query("BEGIN");

        // Buscar y bloquear la factura actual
        const facturaActual = await client.query(
            `
            SELECT *
            FROM Factura_Proveedor
            WHERE Id_Factura_Proveedor = $1
            FOR UPDATE
            `,
            [id]
        );

        if (facturaActual.rows.length === 0) {
            throw new Error("La factura no existe.");
        }

        const factura = facturaActual.rows[0];

        // Archivo opcional en Update
        let archivo_pdf = factura.archivo_pdf;
        if (req.file) {
            archivo_pdf = `/uploads/${req.file.filename}`;
        }

        // No permitir modificar una factura totalmente pagada
        if (factura.estado_pago === "pagado") {
            throw new Error("No se puede modificar una factura pagada.");
        }

        const precioAnterior = roundMoney(parseMoney(factura.precio_total));
        const montoAdeudadoAnterior = roundMoney(parseMoney(factura.monto_adeudado));
        const diferencia = roundMoney(subMoney(nuevoPrecioTotal, precioAnterior));
        const nuevoMontoAdeudado = Math.max(0, roundMoney(addMoney(montoAdeudadoAnterior, diferencia)));

        let nuevoEstado = "pendiente";
        if (nuevoMontoAdeudado <= 0.009) {
            nuevoEstado = "pagado";
        } else if (nuevoMontoAdeudado < nuevoPrecioTotal) {
            nuevoEstado = "parcial";
        }

        // Actualizar la factura
        const resultado = await client.query(
            `
            UPDATE Factura_Proveedor
            SET
                Precio_Total = $1,
                Vencimiento = $2,
                Observaciones = $3,
                Fecha_Emision = $4,
                Monto_Adeudado = $5,
                Estado_Pago = $6,
                Nro_Factura_Proveedor = $7,
                tipo_comprobante = $8,
                archivo_pdf = $9
            WHERE Id_Factura_Proveedor = $10
            RETURNING *
            `,
            [
                nuevoPrecioTotal,
                Vencimiento || null,
                Observaciones || null,
                Fecha_Emision,
                nuevoMontoAdeudado,
                nuevoEstado,
                Nro_Factura_Proveedor || null,
                tipoComp,
                archivo_pdf,
                id
            ]
        );

        // Bloquear y actualizar el saldo del proveedor
        await client.query(
            `
            UPDATE Proveedor
            SET Saldo = Saldo + $1
            WHERE Id_Proveedor = $2
            `,
            [
                diferencia,
                factura.id_proveedor
            ]
        );

        await client.query("COMMIT");

        res.json({
            mensaje: "Factura actualizada correctamente.",
            factura: resultado.rows[0]
        });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error en editarFactura:", error);
        res.status(500).json({
            mensaje: error.message || "Error al actualizar la factura."
        });
    } finally {
        client.release();
    }
};

// Eliminar factura
const eliminarFactura = async (req, res) => {
    const client = await db.connect();

    try {
        const { id } = req.params;

        await client.query("BEGIN");

        // Buscar y bloquear la factura
        const factura = await client.query(
            `
            SELECT *
            FROM Factura_Proveedor
            WHERE Id_Factura_Proveedor = $1
            FOR UPDATE
            `,
            [id]
        );

        if (factura.rows.length === 0) {
            throw new Error("La factura no existe.");
        }

        const datosFactura = factura.rows[0];
        const precioTotal = roundMoney(parseMoney(datosFactura.precio_total));

        // Verificar si tiene pagos asociados
        const pagos = await client.query(
            `
            SELECT *
            FROM Detalle_Pago_Compra
            WHERE Id_Factura_Proveedor = $1
            `,
            [id]
        );

        if (pagos.rows.length > 0) {
            return res.status(400).json({
                error: "No se puede eliminar esta factura porque posee pagos registrados. Debe anular los pagos primero."
            });
        }

        // Bloquear y actualizar saldo del proveedor
        await client.query(
            `
            UPDATE Proveedor
            SET Saldo = Saldo - $1
            WHERE Id_Proveedor = $2
            `,
            [
                precioTotal,
                datosFactura.id_proveedor
            ]
        );

        // Eliminar la factura
        await client.query(
            `
            DELETE FROM Factura_Proveedor
            WHERE Id_Factura_Proveedor = $1
            `,
            [id]
        );

        await client.query("COMMIT");

        res.json({
            mensaje: "Factura eliminada correctamente."
        });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error en eliminarFactura:", error);
        res.status(500).json({
            mensaje: error.message || "Error al eliminar la factura."
        });
    } finally {
        client.release();
    }
};

module.exports = {
    obtenerFacturas,
    obtenerFacturaPorId,
    crearFactura,
    editarFactura,
    eliminarFactura
};