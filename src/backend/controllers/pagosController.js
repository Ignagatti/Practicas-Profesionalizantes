const db = require("../config/db");

// =====================================================
// OBTENER TODOS LOS PAGOS
// =====================================================

const obtenerPagos = async (req, res) => {
    try {
        const { tipo } = req.query;

        if (tipo === "cliente") {
            const resultado = await db.query(`
                SELECT
                    pp.*,
                    mp.Tipo AS tipo_medio_pago
                FROM PagoPedido pp
                LEFT JOIN Metodo_Pago mp
                    ON pp.Id_Medio_Pago = mp.Id_Medio_Pago
                ORDER BY pp.Id_Pago_Pedido DESC
            `);
            return res.json(resultado.rows);
        }

        const resultado = await db.query(`
            SELECT
                pi.*,
                mp.Tipo AS tipo_medio_pago
            FROM Pago_Insumo pi
            LEFT JOIN Metodo_Pago mp
                ON pi.Id_Medio_Pago = mp.Id_Medio_Pago
            ORDER BY pi.Id_Pago_Insumo DESC
        `);

        res.json(resultado.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error al obtener los pagos."
        });

    }
};


// =====================================================
// OBTENER UN PAGO POR ID
// =====================================================

const obtenerPagoPorId = async (req, res) => {

    const { id } = req.params;
    const { tipo } = req.query;

    try {

        if (tipo === "cliente") {
            const pago = await db.query(
                `
                SELECT
                    pp.*,
                    mp.Tipo AS tipo_medio_pago
                FROM PagoPedido pp
                LEFT JOIN Metodo_Pago mp
                    ON pp.Id_Medio_Pago = mp.Id_Medio_Pago
                WHERE pp.Id_Pago_Pedido = $1
                `,
                [id]
            );

            if (pago.rows.length === 0) {
                return res.status(404).json({
                    mensaje: "El pago no existe."
                });
            }

            const detalles = await db.query(
                `
                SELECT
                    dpp.*,
                    p.Nro_Factura,
                    p.Precio_Total,
                    p.Monto_Adeudado,
                    p.Estado_Pago
                FROM Detalle_Pago_Pedido dpp
                INNER JOIN Pedido p
                    ON dpp.Id_Pedido = p.Id_Pedido
                WHERE dpp.Id_Pago_Pedido = $1
                `,
                [id]
            );

            return res.json({
                pago: pago.rows[0],
                detalles: detalles.rows
            });
        }

        const pago = await db.query(
            `
            SELECT
                pi.*,
                mp.Tipo AS tipo_medio_pago
            FROM Pago_Insumo pi
            LEFT JOIN Metodo_Pago mp
                ON pi.Id_Medio_Pago = mp.Id_Medio_Pago
            WHERE pi.Id_Pago_Insumo = $1
            `,
            [id]
        );

        if (pago.rows.length === 0) {

            return res.status(404).json({
                mensaje: "El pago no existe."
            });

        }

        const detalles = await db.query(
            `
            SELECT
                dpc.*,
                fp.Nro_Factura_Proveedor,
                fp.Precio_Total,
                fp.Monto_Adeudado,
                fp.Estado_Pago
            FROM Detalle_Pago_Compra dpc
            INNER JOIN Factura_Proveedor fp
                ON dpc.Id_Factura_Proveedor =
                   fp.Id_Factura_Proveedor
            WHERE dpc.Id_Pago_Insumo = $1
            `,
            [id]
        );

        res.json({
            pago: pago.rows[0],
            detalles: detalles.rows
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error al obtener el pago."
        });

    }

};


// =====================================================
// CREAR UN PAGO
// =====================================================

const crearPago = async (req, res) => {

    const client = await db.connect();

    try {

        const {
            Fecha_Pago,
            Monto,
            Id_Medio_Pago,
            Tipo,
            facturas
        } = req.body;


        // =============================================
        // VALIDACIONES BÁSICAS
        // =============================================

        if (
            !Fecha_Pago ||
            !Monto ||
            !Id_Medio_Pago ||
            !facturas ||
            !Array.isArray(facturas) ||
            facturas.length === 0
        ) {

            return res.status(400).json({
                mensaje: "Faltan datos obligatorios."
            });

        }


        if (Number(Monto) <= 0) {

            return res.status(400).json({
                mensaje: "El monto del pago debe ser mayor que cero."
            });

        }


        // =============================================
        // INICIAR TRANSACCIÓN
        // =============================================

        await client.query("BEGIN");


        // =============================================
        // VERIFICAR MÉTODO DE PAGO
        // =============================================

        const metodoPago = await client.query(
            `
            SELECT *
            FROM Metodo_Pago
            WHERE Id_Medio_Pago = $1
            `,
            [Id_Medio_Pago]
        );


        if (metodoPago.rows.length === 0) {

            throw new Error(
                "El método de pago seleccionado no existe."
            );

        }


        // =============================================
        // VERIFICAR QUE EL MONTO DEL PAGO
        // COINCIDA CON LOS MONTOS APLICADOS
        // =============================================

        const montoPago = Number(Monto);

        const montoAplicado = facturas.reduce(
            (total, factura) => {

                return total + Number(factura.Monto_Usado);

            },
            0
        );


        if (montoAplicado > montoPago) {

            throw new Error(
                "El monto aplicado a las facturas no puede superar el monto total del pago."
            );

        }


        // =============================================
        // CREAR EL PAGO
        // =============================================

        if (Tipo === "cliente") {
            const pago = await client.query(
                `
                INSERT INTO PagoPedido
                (
                    Fecha_Pago,
                    Estado_Pago,
                    Monto,
                    Monto_Restante,
                    Id_Medio_Pago
                )
                VALUES
                (
                    $1,
                    'parcial',
                    $2,
                    $2::numeric - $3::numeric,
                    $4
                )
                RETURNING *
                `,
                [Fecha_Pago, Monto, montoAplicado, Id_Medio_Pago]
            );

            const idPago = pago.rows[0].id_pago_pedido;

            for (const facturaPago of facturas) {
                const { Id_Pedido, Monto_Usado } = facturaPago;

                if (!Id_Pedido || !Monto_Usado || Number(Monto_Usado) <= 0) {
                    throw new Error("Los datos de uno de los pedidos son inválidos.");
                }

                const pedido = await client.query(
                    `
                    SELECT *
                    FROM Pedido
                    WHERE Id_Pedido = $1
                    FOR UPDATE
                    `,
                    [Id_Pedido]
                );

                if (pedido.rows.length === 0) {
                    throw new Error(`El pedido ${Id_Pedido} no existe.`);
                }

                const datosPedido = pedido.rows[0];
                const montoUsado = Number(Monto_Usado);
                const montoAdeudado = Number(datosPedido.monto_adeudado);

                if (montoUsado > montoAdeudado) {
                    throw new Error(`El monto aplicado supera el saldo adeudado del pedido ${Id_Pedido}.`);
                }

                await client.query(
                    `
                    INSERT INTO Detalle_Pago_Pedido
                    (
                        Monto_Usado,
                        Id_Pago_Pedido,
                        Id_Pedido
                    )
                    VALUES ($1, $2, $3)
                    `,
                    [montoUsado, idPago, Id_Pedido]
                );

                const nuevoMontoAdeudado = montoAdeudado - montoUsado;
                let nuevoEstado;

                if (nuevoMontoAdeudado === 0) {
                    nuevoEstado = "pagado";
                } else if (nuevoMontoAdeudado < Number(datosPedido.precio_total)) {
                    nuevoEstado = "parcial";
                } else {
                    nuevoEstado = "pendiente";
                }

                await client.query(
                    `
                    UPDATE Pedido
                    SET
                        Monto_Adeudado = $1,
                        Estado_Pago = $2
                    WHERE Id_Pedido = $3
                    `,
                    [nuevoMontoAdeudado, nuevoEstado, Id_Pedido]
                );

            }

            const montoRestante = montoPago - montoAplicado;
            let estadoPago = "pagado";

            await client.query(
                `
                UPDATE PagoPedido
                SET
                    Monto_Restante = $1,
                    Estado_Pago = $2
                WHERE Id_Pago_Pedido = $3
                `,
                [montoRestante, estadoPago, idPago]
            );

            // ACTUALIZAR SALDO DEL CLIENTE GLOBALY A FAVOR
            const idClienteGlobal = facturas[0].id_cliente || facturas.length > 0 ? (await client.query('SELECT Id_Cliente FROM Pedido WHERE Id_Pedido = $1', [facturas[0].Id_Pedido])).rows[0].id_cliente : null;
            if (idClienteGlobal) {
                await client.query(
                    `UPDATE Cliente SET Saldo = Saldo + $1 WHERE Id_Cliente = $2`,
                    [Monto, idClienteGlobal]
                );
            }

            await client.query("COMMIT");

            return res.status(201).json({
                mensaje: "Pago registrado correctamente.",
                pago: {
                    ...pago.rows[0],
                    monto_restante: montoRestante,
                    estado_pago: estadoPago
                }
            });
        }

        const pago = await client.query(
            `
            INSERT INTO Pago_Insumo
            (
                Fecha_Pago,
                Estado_Pago,
                Monto,
                Monto_Restante,
                Id_Medio_Pago
            )
            VALUES
            (
                $1,
                'pagado',
                $2,
                $2::numeric - $3::numeric,
                $4
            )
            RETURNING *
            `,
            [
                Fecha_Pago,
                Monto,
                montoAplicado,
                Id_Medio_Pago
            ]
        );


        const idPago = pago.rows[0].id_pago_insumo;


        // =============================================
        // PROCESAR CADA FACTURA
        // =============================================

        for (const facturaPago of facturas) {

            const {
                Id_Factura_Proveedor,
                Monto_Usado
            } = facturaPago;


            if (
                !Id_Factura_Proveedor ||
                !Monto_Usado ||
                Number(Monto_Usado) <= 0
            ) {

                throw new Error(
                    "Los datos de una de las facturas son inválidos."
                );

            }


            // -----------------------------------------
            // OBTENER LA FACTURA
            // -----------------------------------------

            const factura = await client.query(
                `
                SELECT *
                FROM Factura_Proveedor
                WHERE Id_Factura_Proveedor = $1
                FOR UPDATE
                `,
                [Id_Factura_Proveedor]
            );


            if (factura.rows.length === 0) {

                throw new Error(
                    `La factura ${Id_Factura_Proveedor} no existe.`
                );

            }


            const datosFactura = factura.rows[0];

            const montoUsado = Number(Monto_Usado);

            const montoAdeudado =
                Number(datosFactura.monto_adeudado);


            // -----------------------------------------
            // NO PERMITIR PAGAR MÁS DE LO ADEUDADO
            // -----------------------------------------

            if (montoUsado > montoAdeudado) {

                throw new Error(
                    `El monto aplicado supera el saldo adeudado de la factura ${Id_Factura_Proveedor}.`
                );

            }


            // -----------------------------------------
            // CREAR DETALLE DEL PAGO
            // -----------------------------------------

            await client.query(
                `
                INSERT INTO Detalle_Pago_Compra
                (
                    Monto_Usado,
                    Id_Pago_Insumo,
                    Id_Factura_Proveedor
                )
                VALUES
                (
                    $1,
                    $2,
                    $3
                )
                `,
                [
                    montoUsado,
                    idPago,
                    Id_Factura_Proveedor
                ]
            );


            // -----------------------------------------
            // CALCULAR NUEVO MONTO ADEUDADO
            // -----------------------------------------

            const nuevoMontoAdeudado =
                montoAdeudado - montoUsado;


            let nuevoEstado;

            if (nuevoMontoAdeudado === 0) {

                nuevoEstado = "pagado";

            } else if (nuevoMontoAdeudado < Number(datosFactura.precio_total)) {

                nuevoEstado = "parcial";

            } else {

                nuevoEstado = "pendiente";

            }


            // -----------------------------------------
            // ACTUALIZAR FACTURA
            // -----------------------------------------

            await client.query(
                `
                UPDATE Factura_Proveedor
                SET
                    Monto_Adeudado = $1,
                    Estado_Pago = $2
                WHERE Id_Factura_Proveedor = $3
                `,
                [
                    nuevoMontoAdeudado,
                    nuevoEstado,
                    Id_Factura_Proveedor
                ]
            );


        }


        // =============================================
        // ACTUALIZAR ESTADO DEL PAGO
        // =============================================

        const montoRestante =
            montoPago - montoAplicado;


        let estadoPago = "pagado";


        await client.query(
            `
            UPDATE Pago_Insumo
            SET
                Monto_Restante = $1,
                Estado_Pago = $2
            WHERE Id_Pago_Insumo = $3
            `,
            [
                montoRestante,
                estadoPago,
                idPago
            ]
        );

        // ACTUALIZAR SALDO DEL PROVEEDOR GLOBALY A FAVOR
        const idProveedorGlobal = facturas.length > 0 ? (await client.query('SELECT Id_Proveedor FROM Factura_Proveedor WHERE Id_Factura_Proveedor = $1', [facturas[0].Id_Factura_Proveedor])).rows[0].id_proveedor : null;
        if (idProveedorGlobal) {
            await client.query(
                `UPDATE Proveedor SET Saldo = Saldo + $1 WHERE Id_Proveedor = $2`,
                [Monto, idProveedorGlobal]
            );
        }


        // =============================================
        // CONFIRMAR TRANSACCIÓN
        // =============================================

        await client.query("COMMIT");


        res.status(201).json({

            mensaje: "Pago registrado correctamente.",

            pago: {
                ...pago.rows[0],
                monto_restante: montoRestante,
                estado_pago: estadoPago
            }

        });


    } catch (error) {

        await client.query("ROLLBACK");

        console.error(error);

        res.status(500).json({

            mensaje: error.message ||
                "Error al registrar el pago."

        });

    } finally {

        client.release();

    }

};


// =====================================================
// ELIMINAR UN PAGO
// =====================================================

const eliminarPago = async (req, res) => {

    const client = await db.connect();
    const { tipo } = req.query;

    try {

        const { id } = req.params;

        await client.query("BEGIN");

        if (tipo === "cliente") {
            const detalles = await client.query(
                `
                SELECT
                    dpp.*,
                    p.Id_Cliente
                FROM Detalle_Pago_Pedido dpp
                INNER JOIN Pedido p
                    ON dpp.Id_Pedido = p.Id_Pedido
                WHERE dpp.Id_Pago_Pedido = $1
                `,
                [id]
            );

            if (detalles.rows.length === 0) {
                throw new Error("El pago no existe o no tiene pedidos asociados.");
            }

            for (const detalle of detalles.rows) {
                const montoUsado = Number(detalle.monto_usado);

                const pedido = await client.query(
                    `
                    SELECT *
                    FROM Pedido
                    WHERE Id_Pedido = $1
                    FOR UPDATE
                    `,
                    [detalle.id_pedido]
                );

                if (pedido.rows.length === 0) {
                    throw new Error("Uno de los pedidos asociados ya no existe.");
                }

                const datosPedido = pedido.rows[0];
                const nuevoMontoAdeudado = Number(datosPedido.monto_adeudado) + montoUsado;
                let nuevoEstado;

                if (nuevoMontoAdeudado >= Number(datosPedido.precio_total)) {
                    nuevoEstado = "pendiente";
                } else {
                    nuevoEstado = "parcial";
                }

                await client.query(
                    `
                    UPDATE Pedido
                    SET
                        Monto_Adeudado = $1,
                        Estado_Pago = $2
                    WHERE Id_Pedido = $3
                    `,
                    [nuevoMontoAdeudado, nuevoEstado, detalle.id_pedido]
                );

            }
            
            const pagoResult = await client.query('SELECT Monto FROM PagoPedido WHERE Id_Pago_Pedido = $1', [id]);
            if (pagoResult.rows.length > 0) {
                await client.query(
                    `UPDATE Cliente SET Saldo = Saldo - $1 WHERE Id_Cliente = $2`,
                    [pagoResult.rows[0].monto, detalles.rows[0].id_cliente]
                );
            }

            await client.query(
                `
                DELETE FROM Detalle_Pago_Pedido
                WHERE Id_Pago_Pedido = $1
                `,
                [id]
            );

            await client.query(
                `
                DELETE FROM PagoPedido
                WHERE Id_Pago_Pedido = $1
                `,
                [id]
            );

            await client.query("COMMIT");
            return res.json({ mensaje: "Pago eliminado correctamente." });
        }


        // =============================================
        // OBTENER LOS DETALLES DEL PAGO
        // =============================================

        const detalles = await client.query(
            `
            SELECT
                dpc.*,
                fp.Id_Proveedor
            FROM Detalle_Pago_Compra dpc
            INNER JOIN Factura_Proveedor fp
                ON dpc.Id_Factura_Proveedor =
                   fp.Id_Factura_Proveedor
            WHERE dpc.Id_Pago_Insumo = $1
            `,
            [id]
        );


        if (detalles.rows.length === 0) {

            throw new Error(
                "El pago no existe o no tiene facturas asociadas."
            );

        }


        // =============================================
        // DEVOLVER LOS MONTOS A LAS FACTURAS
        // =============================================

        for (const detalle of detalles.rows) {

            const montoUsado =
                Number(detalle.monto_usado);


            const factura = await client.query(
                `
                SELECT *
                FROM Factura_Proveedor
                WHERE Id_Factura_Proveedor = $1
                FOR UPDATE
                `,
                [detalle.id_factura_proveedor]
            );


            if (factura.rows.length === 0) {

                throw new Error(
                    "Una de las facturas asociadas ya no existe."
                );

            }


            const datosFactura = factura.rows[0];


            const nuevoMontoAdeudado =
                Number(datosFactura.monto_adeudado) +
                montoUsado;


            let nuevoEstado;

            if (
                nuevoMontoAdeudado >=
                Number(datosFactura.precio_total)
            ) {

                nuevoEstado = "pendiente";

            } else {

                nuevoEstado = "parcial";

            }


            await client.query(
                `
                UPDATE Factura_Proveedor
                SET
                    Monto_Adeudado = $1,
                    Estado_Pago = $2
                WHERE Id_Factura_Proveedor = $3
                `,
                [
                    nuevoMontoAdeudado,
                    nuevoEstado,
                    detalle.id_factura_proveedor
                ]
            );


            // -----------------------------------------
            // DEVOLVER EL MONTO AL SALDO DEL PROVEEDOR
            // -----------------------------------------

            await client.query(
                `
                UPDATE Proveedor
                SET
                    Saldo = Saldo + $1
                WHERE Id_Proveedor = $2
                `,
                [
                    montoUsado,
                    detalle.id_proveedor
                ]
            );

        }
        
        const pagoResult = await client.query('SELECT Monto FROM Pago_Insumo WHERE Id_Pago_Insumo = $1', [id]);
        if (pagoResult.rows.length > 0) {
            await client.query(
                `UPDATE Proveedor SET Saldo = Saldo - $1 WHERE Id_Proveedor = $2`,
                [pagoResult.rows[0].monto, detalles.rows[0].id_proveedor]
            );
        }


        // =============================================
        // ELIMINAR DETALLES DEL PAGO
        // =============================================

        await client.query(
            `
            DELETE FROM Detalle_Pago_Compra
            WHERE Id_Pago_Insumo = $1
            `,
            [id]
        );


        // =============================================
        // ELIMINAR EL PAGO
        // =============================================

        await client.query(
            `
            DELETE FROM Pago_Insumo
            WHERE Id_Pago_Insumo = $1
            `,
            [id]
        );


        await client.query("COMMIT");


        res.json({

            mensaje: "Pago eliminado correctamente."

        });


    } catch (error) {

        await client.query("ROLLBACK");

        console.error(error);

        res.status(500).json({

            mensaje: error.message ||
                "Error al eliminar el pago."

        });

    } finally {

        client.release();

    }

};


// =====================================================
// EXPORTAR FUNCIONES
// =====================================================

module.exports = {

    obtenerPagos,
    obtenerPagoPorId,
    crearPago,
    eliminarPago

};