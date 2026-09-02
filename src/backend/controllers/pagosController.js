const db = require("../config/db");

const parseNum = (val) => {
    if (typeof val === "number") return isNaN(val) ? 0 : val;
    if (!val) return 0;
    let str = String(val).trim();
    if (str.includes(",") && str.includes(".")) {
        str = str.replace(/\./g, "").replace(",", ".");
    } else if (str.includes(",")) {
        str = str.replace(",", ".");
    }
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
};

const redondear = (val) => Math.round((parseNum(val) + Number.EPSILON) * 100) / 100;

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
            facturas,
            monto_favor_usado
        } = req.body;

        const parseNum = (val) => {
            if (typeof val === "number") return isNaN(val) ? 0 : val;
            if (!val) return 0;
            let str = String(val).trim();
            if (str.includes(",") && str.includes(".")) {
                str = str.replace(/\./g, "").replace(",", ".");
            } else if (str.includes(",")) {
                str = str.replace(",", ".");
            }
            const num = parseFloat(str);
            return isNaN(num) ? 0 : num;
        };

        const montoFavorUsado = Math.round(parseNum(monto_favor_usado) * 100) / 100;
        const montoPago = Math.round(parseNum(Monto) * 100) / 100;

        // =============================================
        // VALIDACIONES BÁSICAS
        // =============================================
        if (
            !Fecha_Pago ||
            Monto === undefined ||
            !facturas ||
            !Array.isArray(facturas) ||
            facturas.length === 0
        ) {
            return res.status(400).json({
                mensaje: "Faltan datos obligatorios."
            });
        }

        if (montoPago < 0) {
            return res.status(400).json({
                mensaje: "El monto del pago debe ser mayor o igual a cero."
            });
        }

        if (montoPago === 0 && montoFavorUsado === 0) {
            return res.status(400).json({
                mensaje: "Debe ingresar un monto de pago o aplicar saldo a favor."
            });
        }
        
        if (montoPago > 0 && !Id_Medio_Pago) {
            return res.status(400).json({
                mensaje: "Debe seleccionar un método de pago si el monto es mayor a cero."
            });
        }

        // =============================================
        // INICIAR TRANSACCIÓN
        // =============================================
        await client.query("BEGIN");

        // =============================================
        // VERIFICAR MÉTODO DE PAGO
        // =============================================
        if (montoPago > 0) {
            const metodoPago = await client.query(
                `
                SELECT *
                FROM Metodo_Pago
                WHERE Id_Medio_Pago = $1
                `,
                [Id_Medio_Pago]
            );

            if (metodoPago.rows.length === 0) {
                throw new Error("El método de pago seleccionado no existe.");
            }
        }

        // =============================================
        // VERIFICAR QUE EL MONTO TOTAL DISPONIBLE
        // COINCIDA CON LOS MONTOS APLICADOS
        // =============================================
        const montoAplicado = Math.round(
            facturas.reduce(
                (total, factura) => total + parseNum(factura.Monto_Usado),
                0
            ) * 100
        ) / 100;

        const totalDisponible = Math.round((montoPago + montoFavorUsado) * 100) / 100;

        if (montoAplicado > totalDisponible + 0.01) {
            throw new Error(
                "El monto aplicado a las facturas no puede superar el monto total del pago más el saldo a favor."
            );
        }

        let idPagoNew = null;
        let pagoNewRow = null;

        // 1. Si Monto > 0, crear el pago
        if (montoPago > 0) {
            if (Tipo === "cliente") {
                const pagoRes = await client.query(
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
                        $2,
                        $3
                    )
                    RETURNING *
                    `,
                    [Fecha_Pago, montoPago, Id_Medio_Pago]
                );
                pagoNewRow = pagoRes.rows[0];
                idPagoNew = pagoNewRow.id_pago_pedido;
            } else {
                const pagoRes = await client.query(
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
                        'parcial',
                        $2,
                        $2,
                        $3
                    )
                    RETURNING *
                    `,
                    [Fecha_Pago, montoPago, Id_Medio_Pago]
                );
                pagoNewRow = pagoRes.rows[0];
                idPagoNew = pagoNewRow.id_pago_insumo;
            }
        }

        // 2. Preparar las fuentes de financiamiento (funding sources)
        const sources = [];

        if (idPagoNew) {
            sources.push({
                id: idPagoNew,
                type: 'new',
                disponible: montoPago
            });
        }

        // Si se usa saldo a favor, buscar los pagos existentes con saldo restante
        if (montoFavorUsado > 0) {
            if (Tipo === "cliente") {
                // Obtener cliente del primer pedido
                const idClienteResult = await client.query(
                    'SELECT Id_Cliente FROM Pedido WHERE Id_Pedido = $1',
                    [facturas[0].Id_Pedido]
                );
                if (idClienteResult.rows.length === 0) {
                    throw new Error("No se pudo obtener el cliente del pedido.");
                }
                const idCliente = idClienteResult.rows[0].id_cliente;

                const pagosAFAvor = await client.query(
                    `
                    SELECT * FROM PagoPedido
                    WHERE Id_Pago_Pedido IN (
                        SELECT DISTINCT dpp.Id_Pago_Pedido
                        FROM Detalle_Pago_Pedido dpp
                        JOIN Pedido p ON p.Id_Pedido = dpp.Id_Pedido
                        WHERE p.Id_Cliente = $1
                    ) AND Monto_Restante > 0
                    ORDER BY Fecha_Pago ASC, Id_Pago_Pedido ASC
                    `,
                    [idCliente]
                );

                for (const row of pagosAFAvor.rows) {
                    sources.push({
                        id: row.id_pago_pedido,
                        type: 'old',
                        disponible: Number(row.monto_restante)
                    });
                }
            } else {
                // Proveedor
                const idProveedorResult = await client.query(
                    'SELECT Id_Proveedor FROM Factura_Proveedor WHERE Id_Factura_Proveedor = $1',
                    [facturas[0].Id_Factura_Proveedor]
                );
                if (idProveedorResult.rows.length === 0) {
                    throw new Error("No se pudo obtener el proveedor de la factura.");
                }
                const idProveedor = idProveedorResult.rows[0].id_proveedor;

                const pagosAFAvor = await client.query(
                    `
                    SELECT * FROM Pago_Insumo
                    WHERE Id_Pago_Insumo IN (
                        SELECT DISTINCT dpc.Id_Pago_Insumo
                        FROM Detalle_Pago_Compra dpc
                        JOIN Factura_Proveedor fp ON fp.Id_Factura_Proveedor = dpc.Id_Factura_Proveedor
                        WHERE fp.Id_Proveedor = $1
                    ) AND Monto_Restante > 0
                    ORDER BY Fecha_Pago ASC, Id_Pago_Insumo ASC
                    `,
                    [idProveedor]
                );

                for (const row of pagosAFAvor.rows) {
                    sources.push({
                        id: row.id_pago_insumo,
                        type: 'old',
                        disponible: Number(row.monto_restante)
                    });
                }
            }
        }

        // 3. Procesar cada factura/pedido
        let tieneDeudaRestante = false;
        for (const facturaPago of facturas) {
            if (Tipo === "cliente") {
                const { Id_Pedido, Monto_Usado } = facturaPago;
                if (!Id_Pedido || !Monto_Usado || Number(Monto_Usado) <= 0) {
                    throw new Error("Los datos de uno de los pedidos son inválidos.");
                }

                const pedido = await client.query(
                    `SELECT * FROM Pedido WHERE Id_Pedido = $1 FOR UPDATE`,
                    [Id_Pedido]
                );

                if (pedido.rows.length === 0) {
                    throw new Error(`El pedido ${Id_Pedido} no existe.`);
                }

                const datosPedido = pedido.rows[0];
                const montoTotalDeFactura = redondear(parseNum(Monto_Usado));
                const montoAdeudado = redondear(parseNum(datosPedido.monto_adeudado));

                if (montoTotalDeFactura > montoAdeudado + 0.01) {
                    throw new Error(`El monto aplicado supera el saldo adeudado del pedido ${Id_Pedido}.`);
                }

                let montoFaltaPagar = montoTotalDeFactura;

                // Consumir de los sources
                for (const source of sources) {
                    if (montoFaltaPagar <= 0.009) break;
                    if (source.disponible <= 0.009) continue;

                    const tomar = redondear(Math.min(source.disponible, montoFaltaPagar));
                    
                    // Registrar el Detalle_Pago_Pedido
                    await client.query(
                        `
                        INSERT INTO Detalle_Pago_Pedido
                        (Monto_Usado, Id_Pago_Pedido, Id_Pedido)
                        VALUES ($1, $2, $3)
                        `,
                        [tomar, source.id, Id_Pedido]
                    );

                    source.disponible = redondear(source.disponible - tomar);
                    montoFaltaPagar = redondear(montoFaltaPagar - tomar);

                    // Si es un pago antiguo, actualizar su Monto_Restante inmediatamente
                    if (source.type === 'old') {
                        await client.query(
                            `UPDATE PagoPedido SET Monto_Restante = Monto_Restante - $1 WHERE Id_Pago_Pedido = $2`,
                            [tomar, source.id]
                        );
                    }
                }

                if (montoFaltaPagar > 0.01) {
                    throw new Error(`No hay suficientes fondos (efectivo + saldo a favor) para cubrir el monto aplicado al pedido ${Id_Pedido}.`);
                }

                const nuevoMontoAdeudado = redondear(montoAdeudado - montoTotalDeFactura);
                if (nuevoMontoAdeudado > 0) {
                    tieneDeudaRestante = true;
                }
                let nuevoEstado = "pendiente";
                if (nuevoMontoAdeudado <= 0) {
                    nuevoEstado = "pagado";
                } else if (nuevoMontoAdeudado < redondear(parseNum(datosPedido.precio_total))) {
                    nuevoEstado = "parcial";
                }

                await client.query(
                    `
                    UPDATE Pedido
                    SET Monto_Adeudado = $1, Estado_Pago = $2
                    WHERE Id_Pedido = $3
                    `,
                    [Math.max(0, nuevoMontoAdeudado), nuevoEstado, Id_Pedido]
                );

            } else {
                // Proveedor
                const { Id_Factura_Proveedor, Monto_Usado } = facturaPago;
                if (!Id_Factura_Proveedor || !Monto_Usado || Number(Monto_Usado) <= 0) {
                    throw new Error("Los datos de una de las facturas son inválidos.");
                }

                const factura = await client.query(
                    `SELECT * FROM Factura_Proveedor WHERE Id_Factura_Proveedor = $1 FOR UPDATE`,
                    [Id_Factura_Proveedor]
                );

                if (factura.rows.length === 0) {
                    throw new Error(`La factura ${Id_Factura_Proveedor} no existe.`);
                }

                const datosFactura = factura.rows[0];
                const montoTotalDeFactura = redondear(parseNum(Monto_Usado));
                const montoAdeudado = redondear(parseNum(datosFactura.monto_adeudado));

                if (montoTotalDeFactura > montoAdeudado + 0.01) {
                    throw new Error(`El monto aplicado supera el saldo adeudado de la factura ${Id_Factura_Proveedor}.`);
                }

                let montoFaltaPagar = montoTotalDeFactura;

                // Consumir de los sources
                for (const source of sources) {
                    if (montoFaltaPagar <= 0.009) break;
                    if (source.disponible <= 0.009) continue;

                    const tomar = redondear(Math.min(source.disponible, montoFaltaPagar));
                    
                    // Registrar el Detalle_Pago_Compra
                    await client.query(
                        `
                        INSERT INTO Detalle_Pago_Compra
                        (Monto_Usado, Id_Pago_Insumo, Id_Factura_Proveedor)
                        VALUES ($1, $2, $3)
                        `,
                        [tomar, source.id, Id_Factura_Proveedor]
                    );

                    source.disponible = redondear(source.disponible - tomar);
                    montoFaltaPagar = redondear(montoFaltaPagar - tomar);

                    // Si es un pago antiguo, actualizar su Monto_Restante inmediatamente
                    if (source.type === 'old') {
                        await client.query(
                            `UPDATE Pago_Insumo SET Monto_Restante = Monto_Restante - $1 WHERE Id_Pago_Insumo = $2`,
                            [tomar, source.id]
                        );
                    }
                }

                if (montoFaltaPagar > 0.01) {
                    throw new Error(`No hay suficientes fondos (efectivo + saldo a favor) para cubrir el monto aplicado a la factura ${Id_Factura_Proveedor}.`);
                }

                const nuevoMontoAdeudado = redondear(montoAdeudado - montoTotalDeFactura);
                if (nuevoMontoAdeudado > 0) {
                    tieneDeudaRestante = true;
                }
                let nuevoEstado = "pendiente";
                if (nuevoMontoAdeudado <= 0) {
                    nuevoEstado = "pagado";
                } else if (nuevoMontoAdeudado < redondear(parseNum(datosFactura.precio_total))) {
                    nuevoEstado = "parcial";
                }

                await client.query(
                    `
                    UPDATE Factura_Proveedor
                    SET Monto_Adeudado = $1, Estado_Pago = $2
                    WHERE Id_Factura_Proveedor = $3
                    `,
                    [Math.max(0, nuevoMontoAdeudado), nuevoEstado, Id_Factura_Proveedor]
                );
            }
        }

        // 4. Si se creó un nuevo pago, actualizar su Monto_Restante y Estado_Pago finales
        let finalMontoRestante = 0;
        let finalEstadoPago = tieneDeudaRestante ? "parcial" : "pagado";
        if (idPagoNew) {
            const newSource = sources.find(s => s.type === 'new');
            finalMontoRestante = newSource ? newSource.disponible : 0;
            
            if (Tipo === "cliente") {
                await client.query(
                    `UPDATE PagoPedido SET Monto_Restante = $1, Estado_Pago = $2 WHERE Id_Pago_Pedido = $3`,
                    [finalMontoRestante, finalEstadoPago, idPagoNew]
                );
            } else {
                await client.query(
                    `UPDATE Pago_Insumo SET Monto_Restante = $1, Estado_Pago = $2 WHERE Id_Pago_Insumo = $3`,
                    [finalMontoRestante, finalEstadoPago, idPagoNew]
                );
            }
        }

        // 5. Actualizar el saldo global de Cliente o Proveedor (solo incrementa por el Monto nuevo)
        if (montoPago > 0) {
            if (Tipo === "cliente") {
                const idClienteResult = await client.query(
                    'SELECT Id_Cliente FROM Pedido WHERE Id_Pedido = $1',
                    [facturas[0].Id_Pedido]
                );
                if (idClienteResult.rows.length > 0) {
                    const idClienteGlobal = idClienteResult.rows[0].id_cliente;
                    await client.query(
                        `UPDATE Cliente SET Saldo = Saldo + $1 WHERE Id_Cliente = $2`,
                        [montoPago, idClienteGlobal]
                    );
                }
            } else {
                const idProveedorResult = await client.query(
                    'SELECT Id_Proveedor FROM Factura_Proveedor WHERE Id_Factura_Proveedor = $1',
                    [facturas[0].Id_Factura_Proveedor]
                );
                if (idProveedorResult.rows.length > 0) {
                    const idProveedorGlobal = idProveedorResult.rows[0].id_proveedor;
                    await client.query(
                        `UPDATE Proveedor SET Saldo = Saldo + $1 WHERE Id_Proveedor = $2`,
                        [montoPago, idProveedorGlobal]
                    );
                }
            }
        }

        await client.query("COMMIT");

        return res.status(201).json({
            mensaje: "Pago registrado correctamente.",
            pago: pagoNewRow ? {
                ...pagoNewRow,
                monto_restante: finalMontoRestante,
                estado_pago: finalEstadoPago
            } : { mensaje: "Crédito aplicado." }
        });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error(error);
        return res.status(500).json({
            mensaje: error.message || "Error al registrar el pago."
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