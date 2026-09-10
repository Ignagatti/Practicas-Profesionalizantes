const db = require("../config/db");
const {
    parseMoney,
    roundMoney,
    addMoney,
    subMoney,
    areEqualMoney
} = require("../utils/currencyUtils");

// =====================================================
// OBTENER TODOS LOS PAGOS
// =====================================================

const obtenerPagos = async (req, res) => {
    try {
        const { tipo } = req.query;

        if (tipo === "cliente") {
            const resultado = await db.query(`
                SELECT DISTINCT ON (pp.Id_Pago_Pedido)
                    pp.*,
                    mp.Tipo AS tipo_medio_pago,
                    c.Id_Cliente AS id_cliente,
                    c.Nombre AS nombre_cliente,
                    c.Apellido AS apellido_cliente,
                    c.Razon_Social AS razon_social_cliente
                FROM PagoPedido pp
                LEFT JOIN Metodo_Pago mp
                    ON pp.Id_Medio_Pago = mp.Id_Medio_Pago
                LEFT JOIN Detalle_Pago_Pedido dpp
                    ON pp.Id_Pago_Pedido = dpp.Id_Pago_Pedido
                LEFT JOIN Pedido p
                    ON dpp.Id_Pedido = p.Id_Pedido
                LEFT JOIN Cliente c
                    ON p.Id_Cliente = c.Id_Cliente
                ORDER BY pp.Id_Pago_Pedido DESC
            `);
            return res.json(resultado.rows);
        }

        const resultado = await db.query(`
            SELECT DISTINCT ON (pi.Id_Pago_Insumo)
                pi.*,
                mp.Tipo AS tipo_medio_pago,
                pr.Id_Proveedor AS id_proveedor,
                pr.Nombre AS nombre_proveedor,
                pr.Razon_Social AS razon_social_proveedor
            FROM Pago_Insumo pi
            LEFT JOIN Metodo_Pago mp
                ON pi.Id_Medio_Pago = mp.Id_Medio_Pago
            LEFT JOIN Detalle_Pago_Compra dpc
                ON pi.Id_Pago_Insumo = dpc.Id_Pago_Insumo
            LEFT JOIN Factura_Proveedor fp
                ON dpc.Id_Factura_Proveedor = fp.Id_Factura_Proveedor
            LEFT JOIN Proveedor pr
                ON fp.Id_Proveedor = pr.Id_Proveedor
            ORDER BY pi.Id_Pago_Insumo DESC
        `);

        res.json(resultado.rows);

    } catch (error) {
        console.error("Error en obtenerPagos:", error);
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
                SELECT DISTINCT ON (pp.Id_Pago_Pedido)
                    pp.*,
                    mp.Tipo AS tipo_medio_pago,
                    c.Id_Cliente AS id_cliente,
                    c.Nombre AS nombre_cliente,
                    c.Apellido AS apellido_cliente,
                    c.Razon_Social AS razon_social_cliente
                FROM PagoPedido pp
                LEFT JOIN Metodo_Pago mp
                    ON pp.Id_Medio_Pago = mp.Id_Medio_Pago
                LEFT JOIN Detalle_Pago_Pedido dpp
                    ON pp.Id_Pago_Pedido = dpp.Id_Pago_Pedido
                LEFT JOIN Pedido p
                    ON dpp.Id_Pedido = p.Id_Pedido
                LEFT JOIN Cliente c
                    ON p.Id_Cliente = c.Id_Cliente
                WHERE pp.Id_Pago_Pedido = $1
                ORDER BY pp.Id_Pago_Pedido DESC
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
                ORDER BY dpp.Id_Detalle_Pago_Pedido ASC
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
            SELECT DISTINCT ON (pi.Id_Pago_Insumo)
                pi.*,
                mp.Tipo AS tipo_medio_pago,
                pr.Id_Proveedor AS id_proveedor,
                pr.Nombre AS nombre_proveedor,
                pr.Razon_Social AS razon_social_proveedor
            FROM Pago_Insumo pi
            LEFT JOIN Metodo_Pago mp
                ON pi.Id_Medio_Pago = mp.Id_Medio_Pago
            LEFT JOIN Detalle_Pago_Compra dpc
                ON pi.Id_Pago_Insumo = dpc.Id_Pago_Insumo
            LEFT JOIN Factura_Proveedor fp
                ON dpc.Id_Factura_Proveedor = fp.Id_Factura_Proveedor
            LEFT JOIN Proveedor pr
                ON fp.Id_Proveedor = pr.Id_Proveedor
            WHERE pi.Id_Pago_Insumo = $1
            ORDER BY pi.Id_Pago_Insumo DESC
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
                ON dpc.Id_Factura_Proveedor = fp.Id_Factura_Proveedor
            WHERE dpc.Id_Pago_Insumo = $1
            ORDER BY dpc.Id_Detalle_Pago_Compra ASC
            `,
            [id]
        );

        res.json({
            pago: pago.rows[0],
            detalles: detalles.rows
        });

    } catch (error) {
        console.error("Error en obtenerPagoPorId:", error);
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

        const montoFavorUsado = roundMoney(parseMoney(monto_favor_usado));
        const montoPago = roundMoney(parseMoney(Monto));

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
        // INICIAR TRANSACCIÓN CON CONTROL DE CONCURRENCIA
        // =============================================
        await client.query("BEGIN");

        // Verificar método de pago si hay monto nuevo
        if (montoPago > 0) {
            const metodoPago = await client.query(
                `SELECT * FROM Metodo_Pago WHERE Id_Medio_Pago = $1 FOR SHARE`,
                [Id_Medio_Pago]
            );

            if (metodoPago.rows.length === 0) {
                throw new Error("El método de pago seleccionado no existe.");
            }
        }

        // Calcular total aplicado con redondeo exacto
        const montoAplicado = roundMoney(
            facturas.reduce(
                (total, factura) => total + roundMoney(parseMoney(factura.Monto_Usado)),
                0
            )
        );

        const totalDisponible = roundMoney(addMoney(montoPago, montoFavorUsado));

        if (montoAplicado > totalDisponible + 0.009) {
            throw new Error(
                "El monto aplicado a las facturas no puede superar el monto total del pago más el saldo a favor disponible."
            );
        }

        let idPagoNew = null;
        let pagoNewRow = null;

        // 1. Si Monto > 0, crear el nuevo registro de pago
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
                idPagoNew = pagoNewRow.id_pago_pedido || pagoNewRow.Id_Pago_Pedido;
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
                idPagoNew = pagoNewRow.id_pago_insumo || pagoNewRow.Id_Pago_Insumo;
            }
        }

        // 2. Preparar fuentes de financiamiento (bloqueando filas con FOR UPDATE)
        const sources = [];

        if (idPagoNew) {
            sources.push({
                id: idPagoNew,
                type: 'new',
                disponible: montoPago
            });
        }

        // Si se usa saldo a favor, buscar y bloquear los pagos existentes con saldo restante
        if (montoFavorUsado > 0) {
            if (Tipo === "cliente") {
                const idClienteResult = await client.query(
                    'SELECT Id_Cliente FROM Pedido WHERE Id_Pedido = $1',
                    [facturas[0].Id_Pedido]
                );
                if (idClienteResult.rows.length === 0) {
                    throw new Error("No se pudo obtener el cliente del pedido.");
                }
                const idCliente = idClienteResult.rows[0].id_cliente;

                // Bloqueo de concurrencia: FOR UPDATE en pagos con saldo a favor del cliente
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
                    FOR UPDATE
                    `,
                    [idCliente]
                );

                for (const row of pagosAFAvor.rows) {
                    sources.push({
                        id: row.id_pago_pedido,
                        type: 'old',
                        disponible: roundMoney(parseMoney(row.monto_restante))
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

                // Bloqueo de concurrencia: FOR UPDATE en pagos con saldo a favor del proveedor
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
                    FOR UPDATE
                    `,
                    [idProveedor]
                );

                for (const row of pagosAFAvor.rows) {
                    sources.push({
                        id: row.id_pago_insumo,
                        type: 'old',
                        disponible: roundMoney(parseMoney(row.monto_restante))
                    });
                }
            }
        }

        // 3. Procesar cada comprobante con bloqueo FOR UPDATE
        let tieneDeudaRestante = false;

        // Ordenar facturas por ID para evitar posibles bloqueos mutuos (deadlocks)
        const facturasOrdenadas = [...facturas].sort((a, b) => {
            const idA = a.Id_Pedido || a.Id_Factura_Proveedor || 0;
            const idB = b.Id_Pedido || b.Id_Factura_Proveedor || 0;
            return idA - idB;
        });

        for (const facturaPago of facturasOrdenadas) {
            if (Tipo === "cliente") {
                const { Id_Pedido, Monto_Usado } = facturaPago;
                const montoTotalDeFactura = roundMoney(parseMoney(Monto_Usado));
                if (!Id_Pedido || montoTotalDeFactura <= 0) {
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
                const montoAdeudado = roundMoney(parseMoney(datosPedido.monto_adeudado));

                if (montoTotalDeFactura > montoAdeudado + 0.009) {
                    throw new Error(`El monto aplicado ($${montoTotalDeFactura}) supera el saldo adeudado ($${montoAdeudado}) del pedido ${Id_Pedido}.`);
                }

                let montoFaltaPagar = montoTotalDeFactura;

                // Consumir de los sources
                for (const source of sources) {
                    if (montoFaltaPagar <= 0.009) break;
                    if (source.disponible <= 0.009) continue;

                    const tomar = roundMoney(Math.min(source.disponible, montoFaltaPagar));
                    
                    // Registrar el Detalle_Pago_Pedido
                    await client.query(
                        `
                        INSERT INTO Detalle_Pago_Pedido
                        (Monto_Usado, Id_Pago_Pedido, Id_Pedido)
                        VALUES ($1, $2, $3)
                        `,
                        [tomar, source.id, Id_Pedido]
                    );

                    source.disponible = subMoney(source.disponible, tomar);
                    montoFaltaPagar = subMoney(montoFaltaPagar, tomar);

                    // Si es un pago antiguo, actualizar su Monto_Restante de forma inmediata
                    if (source.type === 'old') {
                        await client.query(
                            `UPDATE PagoPedido SET Monto_Restante = GREATEST(0, Monto_Restante - $1) WHERE Id_Pago_Pedido = $2`,
                            [tomar, source.id]
                        );
                    }
                }

                if (montoFaltaPagar > 0.009) {
                    throw new Error(`Fondos insuficientes (pago + saldo a favor) para cubrir el pedido ${Id_Pedido}.`);
                }

                const nuevoMontoAdeudado = Math.max(0, subMoney(montoAdeudado, montoTotalDeFactura));
                if (nuevoMontoAdeudado > 0.009) {
                    tieneDeudaRestante = true;
                }
                let nuevoEstado = "pendiente";
                if (nuevoMontoAdeudado <= 0.009) {
                    nuevoEstado = "pagado";
                } else if (nuevoMontoAdeudado < roundMoney(parseMoney(datosPedido.precio_total))) {
                    nuevoEstado = "parcial";
                }

                await client.query(
                    `
                    UPDATE Pedido
                    SET Monto_Adeudado = $1, Estado_Pago = $2
                    WHERE Id_Pedido = $3
                    `,
                    [nuevoMontoAdeudado, nuevoEstado, Id_Pedido]
                );

            } else {
                // Proveedor
                const { Id_Factura_Proveedor, Monto_Usado } = facturaPago;
                const montoTotalDeFactura = roundMoney(parseMoney(Monto_Usado));
                if (!Id_Factura_Proveedor || montoTotalDeFactura <= 0) {
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
                const montoAdeudado = roundMoney(parseMoney(datosFactura.monto_adeudado));

                if (montoTotalDeFactura > montoAdeudado + 0.009) {
                    throw new Error(`El monto aplicado ($${montoTotalDeFactura}) supera el saldo adeudado ($${montoAdeudado}) de la factura ${Id_Factura_Proveedor}.`);
                }

                let montoFaltaPagar = montoTotalDeFactura;

                // Consumir de los sources
                for (const source of sources) {
                    if (montoFaltaPagar <= 0.009) break;
                    if (source.disponible <= 0.009) continue;

                    const tomar = roundMoney(Math.min(source.disponible, montoFaltaPagar));
                    
                    // Registrar el Detalle_Pago_Compra
                    await client.query(
                        `
                        INSERT INTO Detalle_Pago_Compra
                        (Monto_Usado, Id_Pago_Insumo, Id_Factura_Proveedor)
                        VALUES ($1, $2, $3)
                        `,
                        [tomar, source.id, Id_Factura_Proveedor]
                    );

                    source.disponible = subMoney(source.disponible, tomar);
                    montoFaltaPagar = subMoney(montoFaltaPagar, tomar);

                    // Si es un pago antiguo, actualizar su Monto_Restante de forma inmediata
                    if (source.type === 'old') {
                        await client.query(
                            `UPDATE Pago_Insumo SET Monto_Restante = GREATEST(0, Monto_Restante - $1) WHERE Id_Pago_Insumo = $2`,
                            [tomar, source.id]
                        );
                    }
                }

                if (montoFaltaPagar > 0.009) {
                    throw new Error(`Fondos insuficientes para cubrir la factura ${Id_Factura_Proveedor}.`);
                }

                const nuevoMontoAdeudado = Math.max(0, subMoney(montoAdeudado, montoTotalDeFactura));
                if (nuevoMontoAdeudado > 0.009) {
                    tieneDeudaRestante = true;
                }
                let nuevoEstado = "pendiente";
                if (nuevoMontoAdeudado <= 0.009) {
                    nuevoEstado = "pagado";
                } else if (nuevoMontoAdeudado < roundMoney(parseMoney(datosFactura.precio_total))) {
                    nuevoEstado = "parcial";
                }

                await client.query(
                    `
                    UPDATE Factura_Proveedor
                    SET Monto_Adeudado = $1, Estado_Pago = $2
                    WHERE Id_Factura_Proveedor = $3
                    `,
                    [nuevoMontoAdeudado, nuevoEstado, Id_Factura_Proveedor]
                );
            }
        }

        // 4. Si se creó un nuevo pago, actualizar su Monto_Restante y Estado_Pago finales
        let finalMontoRestante = 0;
        let finalEstadoPago = tieneDeudaRestante ? "parcial" : "pagado";
        if (idPagoNew) {
            const newSource = sources.find(s => s.type === 'new');
            finalMontoRestante = newSource ? roundMoney(newSource.disponible) : 0;
            
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

        // 5. Actualizar el saldo global de la entidad con bloqueo FOR UPDATE
        if (montoPago > 0) {
            if (Tipo === "cliente") {
                const idClienteResult = await client.query(
                    'SELECT Id_Cliente FROM Pedido WHERE Id_Pedido = $1',
                    [facturas[0].Id_Pedido]
                );
                if (idClienteResult.rows.length > 0) {
                    const idClienteGlobal = idClienteResult.rows[0].id_cliente;
                    await client.query(
                        `SELECT Id_Cliente FROM Cliente WHERE Id_Cliente = $1 FOR UPDATE`,
                        [idClienteGlobal]
                    );
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
                        `SELECT Id_Proveedor FROM Proveedor WHERE Id_Proveedor = $1 FOR UPDATE`,
                        [idProveedorGlobal]
                    );
                    await client.query(
                        `UPDATE Proveedor SET Saldo = Saldo - $1 WHERE Id_Proveedor = $2`,
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
        console.error("Error en crearPago:", error);
        return res.status(500).json({
            mensaje: error.message || "Error al registrar el pago."
        });
    } finally {
        client.release();
    }
};


// =====================================================
// ELIMINAR UN PAGO CON VERIFICACIÓN DE CRÉDITO Y CONCURRENCIA
// =====================================================

const eliminarPago = async (req, res) => {
    const client = await db.connect();
    const { tipo } = req.query;

    try {
        const { id } = req.params;

        await client.query("BEGIN");

        if (tipo === "cliente") {
            // 1. Bloquear y verificar el pago
            const pagoRes = await client.query(
                `SELECT * FROM PagoPedido WHERE Id_Pago_Pedido = $1 FOR UPDATE`,
                [id]
            );

            if (pagoRes.rows.length === 0) {
                throw new Error("El pago no existe.");
            }

            const datosPago = pagoRes.rows[0];
            const montoPagoOriginal = roundMoney(parseMoney(datosPago.monto));
            const montoRestanteActual = roundMoney(parseMoney(datosPago.monto_restante));

            // 2. Obtener todos los detalles del pago
            const detalles = await client.query(
                `
                SELECT
                    dpp.*,
                    p.Id_Cliente,
                    p.Precio_Total,
                    p.Monto_Adeudado
                FROM Detalle_Pago_Pedido dpp
                INNER JOIN Pedido p
                    ON dpp.Id_Pedido = p.Id_Pedido
                WHERE dpp.Id_Pago_Pedido = $1
                FOR UPDATE OF p
                `,
                [id]
            );

            // Calcular suma total de montos usados en detalles asociados
            const sumaDetallesUsados = roundMoney(
                detalles.rows.reduce((acc, d) => acc + roundMoney(parseMoney(d.monto_usado)), 0)
            );

            // 3. Verificación de Riesgo 3: Si el crédito ya fue consumido en otros comprobantes posteriores
            // Si el monto restante actual es menor a lo que debería quedar (MontoOriginal - sumaDetalles),
            // significa que hubo consumos externos de su crédito.
            const montoRestanteEsperado = Math.max(0, subMoney(montoPagoOriginal, sumaDetallesUsados));
            if (montoRestanteActual < montoRestanteEsperado - 0.009) {
                throw new Error(
                    "No se puede eliminar este pago porque su saldo a favor ya ha sido consumido en comprobantes posteriores. Debe revertir primero los consumos de crédito asociados."
                );
            }

            // 4. Restaurar el Monto_Adeudado y Estado_Pago en cada Pedido afectado
            for (const detalle of detalles.rows) {
                const montoUsado = roundMoney(parseMoney(detalle.monto_usado));
                const pedidoId = detalle.id_pedido;

                const pedidoActual = await client.query(
                    `SELECT Precio_Total, Monto_Adeudado FROM Pedido WHERE Id_Pedido = $1 FOR UPDATE`,
                    [pedidoId]
                );

                if (pedidoActual.rows.length > 0) {
                    const row = pedidoActual.rows[0];
                    const precioTotal = roundMoney(parseMoney(row.precio_total));
                    const montoAdeudadoActual = roundMoney(parseMoney(row.monto_adeudado));
                    const nuevoMontoAdeudado = roundMoney(addMoney(montoAdeudadoActual, montoUsado));

                    let nuevoEstado = "pendiente";
                    if (nuevoMontoAdeudado >= precioTotal - 0.009) {
                        nuevoEstado = "pendiente";
                    } else if (nuevoMontoAdeudado > 0.009) {
                        nuevoEstado = "parcial";
                    } else {
                        nuevoEstado = "pagado";
                    }

                    await client.query(
                        `UPDATE Pedido SET Monto_Adeudado = $1, Estado_Pago = $2 WHERE Id_Pedido = $3`,
                        [nuevoMontoAdeudado, nuevoEstado, pedidoId]
                    );
                }
            }

            // 5. Ajustar saldo del Cliente si se registró monto
            if (detalles.rows.length > 0 && montoPagoOriginal > 0) {
                const idCliente = detalles.rows[0].id_cliente;
                await client.query(
                    `SELECT Id_Cliente FROM Cliente WHERE Id_Cliente = $1 FOR UPDATE`,
                    [idCliente]
                );
                await client.query(
                    `UPDATE Cliente SET Saldo = Saldo - $1 WHERE Id_Cliente = $2`,
                    [montoPagoOriginal, idCliente]
                );
            }

            // 6. Eliminar detalles y el pago
            await client.query(`DELETE FROM Detalle_Pago_Pedido WHERE Id_Pago_Pedido = $1`, [id]);
            await client.query(`DELETE FROM PagoPedido WHERE Id_Pago_Pedido = $1`, [id]);

            await client.query("COMMIT");
            return res.json({ mensaje: "Pago eliminado correctamente." });
        }

        // =============================================
        // ELIMINAR PAGO PROVEEDOR
        // =============================================
        const pagoRes = await client.query(
            `SELECT * FROM Pago_Insumo WHERE Id_Pago_Insumo = $1 FOR UPDATE`,
            [id]
        );

        if (pagoRes.rows.length === 0) {
            throw new Error("El pago no existe.");
        }

        const datosPago = pagoRes.rows[0];
        const montoPagoOriginal = roundMoney(parseMoney(datosPago.monto));
        const montoRestanteActual = roundMoney(parseMoney(datosPago.monto_restante));

        const detalles = await client.query(
            `
            SELECT
                dpc.*,
                fp.Id_Proveedor,
                fp.Precio_Total,
                fp.Monto_Adeudado
            FROM Detalle_Pago_Compra dpc
            INNER JOIN Factura_Proveedor fp
                ON dpc.Id_Factura_Proveedor = fp.Id_Factura_Proveedor
            WHERE dpc.Id_Pago_Insumo = $1
            FOR UPDATE OF fp
            `,
            [id]
        );

        const sumaDetallesUsados = roundMoney(
            detalles.rows.reduce((acc, d) => acc + roundMoney(parseMoney(d.monto_usado)), 0)
        );

        // Verificación de Riesgo 3 en Proveedor
        const montoRestanteEsperado = Math.max(0, subMoney(montoPagoOriginal, sumaDetallesUsados));
        if (montoRestanteActual < montoRestanteEsperado - 0.009) {
            throw new Error(
                "No se puede eliminar este pago porque su saldo a favor ya ha sido consumido en comprobantes posteriores. Debe revertir primero los consumos de crédito asociados."
            );
        }

        // Restaurar deuda en cada Factura_Proveedor
        for (const detalle of detalles.rows) {
            const montoUsado = roundMoney(parseMoney(detalle.monto_usado));
            const facturaId = detalle.id_factura_proveedor;

            const facturaActual = await client.query(
                `SELECT Precio_Total, Monto_Adeudado FROM Factura_Proveedor WHERE Id_Factura_Proveedor = $1 FOR UPDATE`,
                [facturaId]
            );

            if (facturaActual.rows.length > 0) {
                const row = facturaActual.rows[0];
                const precioTotal = roundMoney(parseMoney(row.precio_total));
                const montoAdeudadoActual = roundMoney(parseMoney(row.monto_adeudado));
                const nuevoMontoAdeudado = roundMoney(addMoney(montoAdeudadoActual, montoUsado));

                let nuevoEstado = "pendiente";
                if (nuevoMontoAdeudado >= precioTotal - 0.009) {
                    nuevoEstado = "pendiente";
                } else if (nuevoMontoAdeudado > 0.009) {
                    nuevoEstado = "parcial";
                } else {
                    nuevoEstado = "pagado";
                }

                await client.query(
                    `UPDATE Factura_Proveedor SET Monto_Adeudado = $1, Estado_Pago = $2 WHERE Id_Factura_Proveedor = $3`,
                    [nuevoMontoAdeudado, nuevoEstado, facturaId]
                );
            }
        }

        // Restaurar saldo global del Proveedor (sumar de vuelta el monto pagado eliminado)
        if (detalles.rows.length > 0 && montoPagoOriginal > 0) {
            const idProveedor = detalles.rows[0].id_proveedor;
            await client.query(
                `SELECT Id_Proveedor FROM Proveedor WHERE Id_Proveedor = $1 FOR UPDATE`,
                [idProveedor]
            );
            await client.query(
                `UPDATE Proveedor SET Saldo = Saldo + $1 WHERE Id_Proveedor = $2`,
                [montoPagoOriginal, idProveedor]
            );
        }

        // Eliminar detalles y el pago
        await client.query(`DELETE FROM Detalle_Pago_Compra WHERE Id_Pago_Insumo = $1`, [id]);
        await client.query(`DELETE FROM Pago_Insumo WHERE Id_Pago_Insumo = $1`, [id]);

        await client.query("COMMIT");
        res.json({ mensaje: "Pago eliminado correctamente." });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error en eliminarPago:", error);
        res.status(500).json({
            mensaje: error.message || "Error al eliminar el pago."
        });
    } finally {
        client.release();
    }
};


// =====================================================
// EDITAR PAGO (Fecha y Método de Pago)
// =====================================================

const editarPago = async (req, res) => {
    const { id } = req.params;
    const { tipo } = req.query;
    const { fecha_pago, id_medio_pago, tipo_medio_pago } = req.body;

    try {
        let medioPagoId = id_medio_pago ? Number(id_medio_pago) : null;

        if (!medioPagoId && tipo_medio_pago) {
            const medioRes = await db.query(
                `SELECT Id_Medio_Pago FROM Metodo_Pago WHERE LOWER(Tipo::text) = LOWER($1) LIMIT 1`,
                [tipo_medio_pago.trim()]
            );
            if (medioRes.rows.length > 0) {
                medioPagoId = medioRes.rows[0].id_medio_pago || medioRes.rows[0].Id_Medio_Pago;
            }
        }

        if (tipo === "cliente") {
            const result = await db.query(
                `UPDATE PagoPedido 
                 SET Fecha_Pago = COALESCE($1::date, Fecha_Pago),
                     Id_Medio_Pago = COALESCE($2::int, Id_Medio_Pago)
                 WHERE Id_Pago_Pedido = $3
                 RETURNING *`,
                [fecha_pago || null, medioPagoId || null, id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ mensaje: "El pago no existe." });
            }

            return res.json({
                mensaje: "Pago actualizado correctamente.",
                pago: result.rows[0]
            });
        }

        const result = await db.query(
            `UPDATE Pago_Insumo 
             SET Fecha_Pago = COALESCE($1::date, Fecha_Pago),
                 Id_Medio_Pago = COALESCE($2::int, Id_Medio_Pago)
             WHERE Id_Pago_Insumo = $3
             RETURNING *`,
            [fecha_pago || null, medioPagoId || null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ mensaje: "El pago no existe." });
        }

        res.json({
            mensaje: "Pago actualizado correctamente.",
            pago: result.rows[0]
        });
    } catch (error) {
        console.error("Error al editar pago:", error);
        res.status(500).json({
            mensaje: error.message || "Error al actualizar el pago."
        });
    }
};


// =====================================================
// EXPORTAR FUNCIONES
// =====================================================

module.exports = {
    obtenerPagos,
    obtenerPagoPorId,
    crearPago,
    editarPago,
    eliminarPago
};