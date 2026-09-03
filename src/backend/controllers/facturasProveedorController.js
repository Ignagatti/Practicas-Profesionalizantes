const db = require("../config/db");

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

        console.error(error);
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

        console.error(error);

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

        const archivo_pdf = req.file ? `/uploads/${req.file.filename}` : null;
        const tipoComp = tipo_comprobante || 'factura';

         // Validaciones
        if (
            !Precio_Total ||
            !Fecha_Emision ||
            !Id_Proveedor
        ) {
            return res.status(400).json({
                mensaje: "Faltan datos obligatorios."
            });
        }

        if (Number(Precio_Total) <= 0) {
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

         // 3️⃣ Verificar que exista el proveedor
        const proveedor = await client.query(
            `
            SELECT *
            FROM Proveedor
            WHERE Id_Proveedor = $1
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
                Precio_Total,
                Vencimiento,
                Observaciones,
                Fecha_Emision,
                Nro_Factura_Proveedor || null,
                Id_Proveedor,
                tipoComp,
                archivo_pdf
            ]
        );

        // Actualizar saldo del proveedor
        await client.query(
            `
            UPDATE Proveedor
            SET Saldo = Saldo + $1
            WHERE Id_Proveedor = $2
            `,
            [
                Precio_Total,
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

        console.error(error);

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

        const tipoComp = tipo_comprobante || 'factura';

        // Validaciones
        if (!Precio_Total || !Fecha_Emision) {
            return res.status(400).json({
                mensaje: "Faltan datos obligatorios."
            });
        }

        if (Number(Precio_Total) <= 0) {
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

        // Buscar la factura actual
        const facturaActual = await client.query(
            `
            SELECT *
            FROM Factura_Proveedor
            WHERE Id_Factura_Proveedor = $1
            `,
            [id]
        );

        if (facturaActual.rows.length === 0) {
            throw new Error("La factura no existe.");
        }

        const factura = facturaActual.rows[0];

        // Archivo opcional en Update, si no hay archivo, preservamos el anterior.
        let archivo_pdf = factura.archivo_pdf;
        if (req.file) {
            archivo_pdf = `/uploads/${req.file.filename}`;
        }

        // No permitir modificar una factura totalmente pagada
        if (factura.estado_pago === "pagado") {
            throw new Error("No se puede modificar una factura pagada.");
        }

        // Calcular diferencia entre el monto nuevo y el anterior
        const diferencia =
            Number(Precio_Total) - Number(factura.precio_total);

        // Actualizar la factura
        const resultado = await client.query(
            `
            UPDATE Factura_Proveedor
            SET
                Precio_Total = $1,
                Vencimiento = $2,
                Observaciones = $3,
                Fecha_Emision = $4,
                Monto_Adeudado = Monto_Adeudado + $5,
                Nro_Factura_Proveedor = $6,
                tipo_comprobante = $8,
                archivo_pdf = $9
            WHERE Id_Factura_Proveedor = $7
            RETURNING *
            `,
            [
                Precio_Total,
                Vencimiento,
                Observaciones,
                Fecha_Emision,
                diferencia,
                Nro_Factura_Proveedor || null,
                id,
                tipoComp,
                archivo_pdf
            ]
        );

        // Actualizar el saldo del proveedor
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

        console.error(error);

        res.status(500).json({
            mensaje: error.message
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

        // Buscar la factura
        const factura = await client.query(
            `
            SELECT *
            FROM Factura_Proveedor
            WHERE Id_Factura_Proveedor = $1
            `,
            [id]
        );

        if (factura.rows.length === 0) {
            throw new Error("La factura no existe.");
        }

        const datosFactura = factura.rows[0];

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
                error: "No se puede eliminar esta factura porque posee pagos registrados. No comprometas la contabilidad."
            });
        }

        // Actualizar saldo del proveedor
        await client.query(
            `
            UPDATE Proveedor
            SET Saldo = Saldo - $1
            WHERE Id_Proveedor = $2
            `,
            [
                datosFactura.precio_total,
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

        console.error(error);

        res.status(500).json({
            mensaje: error.message
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