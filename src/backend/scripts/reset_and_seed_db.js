require("dotenv").config();
const pool = require("../config/db");
const migrate = require("./migrate");

async function resetAndSeed() {
  const client = await pool.connect();

  try {
    console.log("===============================================================");
    console.log("🧹 REINICIALIZACIÓN TOTAL Y SIMULACIÓN COMPLETA DEL SISTEMA");
    console.log("===============================================================\n");

    // 1. Asegurar migraciones
    await migrate();

    await client.query("BEGIN");

    // 2. Truncar todas las tablas
    console.log("1. Vaciando tablas...");
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name != 'spatial_ref_sys';
    `);

    const tableNames = tablesRes.rows.map(r => `"${r.table_name}"`).join(", ");
    if (tableNames.length > 0) {
      await client.query(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE;`);
      console.log(`   Tablas vaciadas: ${tablesRes.rows.map(r => r.table_name).join(", ")}`);
    }

    // 3. Métodos de Pago
    console.log("2. Insertando Métodos de Pago...");
    await client.query(`
      INSERT INTO metodo_pago (id_medio_pago, tipo) VALUES 
        (1, 'efectivo'),
        (2, 'transferencia'),
        (3, 'cheque'),
        (4, 'tarjeta')
      ON CONFLICT (id_medio_pago) DO NOTHING;
    `);

    // 4. Insumos clasificados
    console.log("3. Insertando Catálogo de Insumos Reales...");
    const insumos = [
      // MODELOS DE FABRICACIÓN
      { nombre: "Silla Nórdica", categoria: "Modelo", precio: 18000.00 },
      { nombre: "Silla Vestida", categoria: "Modelo", precio: 22000.00 },
      { nombre: "Sillón Berger", categoria: "Modelo", precio: 45000.00 },
      { nombre: "Banqueta Alta", categoria: "Modelo", precio: 14000.00 },
      { nombre: "Mesa Comedor 1.60m", categoria: "Modelo", precio: 85000.00 },
      { nombre: "Mesa Ratona", categoria: "Modelo", precio: 32000.00 },
      
      // TELAS Y TAPIZADOS
      { nombre: "Pana Antimanchas", categoria: "Tela", precio: 9500.00 },
      { nombre: "Lino Spazio", categoria: "Tela", precio: 11000.00 },
      { nombre: "Chenille Soft", categoria: "Tela", precio: 8200.00 },
      { nombre: "Cuero Vacuno", categoria: "Tela", precio: 28000.00 },
      { nombre: "Pana Rústica", categoria: "Tela", precio: 10500.00 },
      { nombre: "Eco Cuero Premium", categoria: "Tela", precio: 7500.00 },

      // LUSTRES Y ACABADOS
      { nombre: "Paraíso Natural", categoria: "Lustre", precio: 4500.00 },
      { nombre: "Petiribí", categoria: "Lustre", precio: 5200.00 },
      { nombre: "Nogal Clásico", categoria: "Lustre", precio: 4800.00 },
      { nombre: "Blanco Laqueado", categoria: "Lustre", precio: 6000.00 },
      { nombre: "Roble Oscuro", categoria: "Lustre", precio: 5000.00 },
      { nombre: "Negro Semi-mate", categoria: "Lustre", precio: 5500.00 }
    ];

    for (const ins of insumos) {
      await client.query(
        `INSERT INTO insumo (nombre, categoria, precio_unitario, activo) VALUES ($1, $2, $3::numeric, true);`,
        [ins.nombre, ins.categoria, ins.precio]
      );
    }

    // 5. Proveedores
    console.log("4. Insertando Proveedores con Domicilios...");
    const prov1 = await client.query(`
      INSERT INTO proveedor (nombre, apellido, razon_social, cuit_cuil, telefono, email, estado, saldo)
      VALUES ('Roberto', 'Alonso', 'Maderas del Litoral S.R.L.', '30554433221', '3496420111', 'ventas@maderaslitoral.com', 'activo', 0)
      RETURNING id_proveedor;
    `);
    const idProv1 = prov1.rows[0].id_proveedor;
    await client.query(`
      INSERT INTO direccion (calle, numero, ciudad, provincia, codigo_postal, id_proveedor)
      VALUES ('Av. Colonizadores', '1250', 'Esperanza', 'Santa Fe', '3080', $1::int);
    `, [idProv1]);

    const prov2 = await client.query(`
      INSERT INTO proveedor (nombre, apellido, razon_social, cuit_cuil, telefono, email, estado, saldo)
      VALUES ('Esteban', 'Rossi', 'Textiles Santa Fe S.A.', '30667788993', '3424558899', 'contacto@textilessantafe.com', 'activo', 0)
      RETURNING id_proveedor;
    `);
    const idProv2 = prov2.rows[0].id_proveedor;
    await client.query(`
      INSERT INTO direccion (calle, numero, ciudad, provincia, codigo_postal, id_proveedor)
      VALUES ('Rivadavia', '3420', 'Santa Fe', 'Santa Fe', '3000', $1::int);
    `, [idProv2]);

    const prov3 = await client.query(`
      INSERT INTO proveedor (nombre, apellido, razon_social, cuit_cuil, telefono, email, estado, saldo)
      VALUES ('Ignacio', 'Vera', 'Lustres del Centro S.A.', '30778899115', '3492445566', 'pedidos@lustrescentro.com', 'activo', 0)
      RETURNING id_proveedor;
    `);
    const idProv3 = prov3.rows[0].id_proveedor;
    await client.query(`
      INSERT INTO direccion (calle, numero, ciudad, provincia, codigo_postal, id_proveedor)
      VALUES ('Bv. Lehmann', '540', 'Rafaela', 'Santa Fe', '2300', $1::int);
    `, [idProv3]);

    // 6. Clientes
    console.log("5. Insertando Clientes con Domicilios...");
    const cli1 = await client.query(`
      INSERT INTO cliente (nombre, apellido, razon_social, cuit_cuil, telefono, email, estado, saldo)
      VALUES ('Juan', 'Pérez', 'Mueblería Confort S.A.', '30712345679', '3496412345', 'compras@muebleriaconfort.com', 'activo', 0)
      RETURNING id_cliente;
    `);
    const idCli1 = cli1.rows[0].id_cliente;
    await client.query(`
      INSERT INTO direccion (calle, numero, ciudad, provincia, codigo_postal, id_cliente)
      VALUES ('San Martín', '850', 'Esperanza', 'Santa Fe', '3080', $1::int);
    `, [idCli1]);

    const cli2 = await client.query(`
      INSERT INTO cliente (nombre, apellido, razon_social, cuit_cuil, telefono, email, estado, saldo)
      VALUES ('María Laura', 'Gomez', 'Diseño & Hogar', '27289998884', '3424987654', 'info@disenoyhogar.com', 'activo', 0)
      RETURNING id_cliente;
    `);
    const idCli2 = cli2.rows[0].id_cliente;
    await client.query(`
      INSERT INTO direccion (calle, numero, ciudad, provincia, codigo_postal, id_cliente)
      VALUES ('Bv. Pellegrini', '2100', 'Santa Fe', 'Santa Fe', '3000', $1::int);
    `, [idCli2]);

    const cli3 = await client.query(`
      INSERT INTO cliente (nombre, apellido, razon_social, cuit_cuil, telefono, email, estado, saldo)
      VALUES ('Carlos', 'Martínez', 'Estudio Arquitectura Moderna', '20254443332', '3434112233', 'estudio@martinez-arq.com', 'activo', 0)
      RETURNING id_cliente;
    `);
    const idCli3 = cli3.rows[0].id_cliente;
    await client.query(`
      INSERT INTO direccion (calle, numero, ciudad, provincia, codigo_postal, id_cliente)
      VALUES ('Urquiza', '1020', 'Paraná', 'Entre Ríos', '3100', $1::int);
    `, [idCli3]);

    // 7. Catálogo de Productos
    console.log("6. Insertando Productos...");
    // P1: 4 Sillas Nórdicas para Juan Pérez
    const p1 = await client.query(`
      INSERT INTO producto (modelo, tela, color_lustre, estado, cantidad, precio, observaciones, fecha_pedido, id_cliente, activo)
      VALUES ('Silla Nórdica', 'Lino Spazio', 'Paraíso Natural', 'terminado', 4, 33500.00, 'Juego para comedor principal', NOW() - INTERVAL '20 days', $1::int, true)
      RETURNING id_producto;
    `, [idCli1]);
    const idProd1 = p1.rows[0].id_producto;

    // P2: 2 Sillones Berger para María Laura Gomez
    const p2 = await client.query(`
      INSERT INTO producto (modelo, tela, color_lustre, estado, cantidad, precio, observaciones, fecha_pedido, id_cliente, activo)
      VALUES ('Sillón Berger', 'Pana Antimanchas', 'Petiribí', 'en_produccion', 2, 59700.00, 'Para sala de estar', NOW() - INTERVAL '10 days', $1::int, true)
      RETURNING id_producto;
    `, [idCli2]);
    const idProd2 = p2.rows[0].id_producto;

    // P3: 4 Banquetas Altas para Juan Pérez
    const p3 = await client.query(`
      INSERT INTO producto (modelo, tela, color_lustre, estado, cantidad, precio, observaciones, fecha_pedido, id_cliente, activo)
      VALUES ('Banqueta Alta', 'Chenille Soft', 'Blanco Laqueado', 'terminado', 4, 28200.00, 'Para barra desayunadora', NOW() - INTERVAL '5 days', $1::int, true)
      RETURNING id_producto;
    `, [idCli1]);
    const idProd3 = p3.rows[0].id_producto;

    // P4: 1 Mesa Comedor 1.60m para Carlos Martínez
    const p4 = await client.query(`
      INSERT INTO producto (modelo, tela, color_lustre, estado, cantidad, precio, observaciones, fecha_pedido, id_cliente, activo)
      VALUES ('Mesa Comedor 1.60m', 'Sin Tela', 'Roble Oscuro', 'pendiente', 1, 95000.00, 'Para sala de reuniones', NOW() - INTERVAL '15 days', $1::int, true)
      RETURNING id_producto;
    `, [idCli3]);
    const idProd4 = p4.rows[0].id_producto;

    // P5: 6 Sillas Vestidas para María Laura Gomez
    const p5 = await client.query(`
      INSERT INTO producto (modelo, tela, color_lustre, estado, cantidad, precio, observaciones, fecha_pedido, id_cliente, activo)
      VALUES ('Silla Vestida', 'Cuero Vacuno', 'Nogal Clásico', 'en_produccion', 6, 54800.00, 'Para comedor señorial', NOW() - INTERVAL '8 days', $1::int, true)
      RETURNING id_producto;
    `, [idCli2]);
    const idProd5 = p5.rows[0].id_producto;

    // P6: 1 Mesa Ratona para Carlos Martínez
    const p6 = await client.query(`
      INSERT INTO producto (modelo, tela, color_lustre, estado, cantidad, precio, observaciones, fecha_pedido, id_cliente, activo)
      VALUES ('Mesa Ratona', 'Sin Tela', 'Petiribí', 'pendiente', 1, 37200.00, 'Para sala de espera', NOW() - INTERVAL '2 days', $1::int, true)
      RETURNING id_producto;
    `, [idCli3]);
    const idProd6 = p6.rows[0].id_producto;

    // P7 (Stock disponible para Juan Pérez, no asignado a pedido aún)
    await client.query(`
      INSERT INTO producto (modelo, tela, color_lustre, estado, cantidad, precio, observaciones, fecha_pedido, id_cliente, activo)
      VALUES ('Banqueta Alta', 'Eco Cuero Premium', 'Negro Semi-mate', 'pendiente', 2, 27000.00, 'Stock de reposición', NOW(), $1::int, true);
    `, [idCli1]);

    // 8. Pedidos de Clientes
    console.log("7. Insertando Pedidos de Clientes...");
    
    // Pedido 1 (Juan Pérez): Total $162.140 con IVA (4 Sillas Nórdicas). PAGADO TOTALMENTE.
    const ped1 = await client.query(`
      INSERT INTO pedido (fecha_generacion, vencimiento, observaciones, precio_total, estado_facturacion, nro_factura, monto_adeudado, estado_pago, id_cliente)
      VALUES (NOW() - INTERVAL '20 days', (NOW() - INTERVAL '5 days')::date, 'Entregado y conforme', 162140.00, 'se_factura', 'A-0001-00008420', 0, 'pagado', $1::int)
      RETURNING id_pedido;
    `, [idCli1]);
    const idPed1 = ped1.rows[0].id_pedido;
    await client.query(`INSERT INTO detalle_pedido (id_pedido, id_producto) VALUES ($1::int, $2::int);`, [idPed1, idProd1]);

    // Pedido 2 (María Laura Gomez): Total $119.400 (2 Sillones Berger). PAGO PARCIAL (Debe $59.400). Próximo a vencer.
    const ped2 = await client.query(`
      INSERT INTO pedido (fecha_generacion, vencimiento, observaciones, precio_total, estado_facturacion, nro_factura, monto_adeudado, estado_pago, id_cliente)
      VALUES (NOW() - INTERVAL '10 days', (NOW() + INTERVAL '7 days')::date, 'Entrega en domicilio comercial', 119400.00, 'no_se_factura', NULL, 59400.00, 'parcial', $1::int)
      RETURNING id_pedido;
    `, [idCli2]);
    const idPed2 = ped2.rows[0].id_pedido;
    await client.query(`INSERT INTO detalle_pedido (id_pedido, id_producto) VALUES ($1::int, $2::int);`, [idPed2, idProd2]);

    // Pedido 3 (Carlos Martínez): Total $114.950 con IVA (Mesa Comedor). PENDIENTE Y VENCIDO (Debe $114.950).
    const ped3 = await client.query(`
      INSERT INTO pedido (fecha_generacion, vencimiento, observaciones, precio_total, estado_facturacion, nro_factura, monto_adeudado, estado_pago, id_cliente)
      VALUES (NOW() - INTERVAL '15 days', (NOW() - INTERVAL '2 days')::date, 'Mesa para sala de directorio', 114950.00, 'se_factura', 'A-0001-00008421', 114950.00, 'pendiente', $1::int)
      RETURNING id_pedido;
    `, [idCli3]);
    const idPed3 = ped3.rows[0].id_pedido;
    await client.query(`INSERT INTO detalle_pedido (id_pedido, id_producto) VALUES ($1::int, $2::int);`, [idPed3, idProd4]);

    // Pedido 4 (Juan Pérez): Total $112.800 (4 Banquetas Altas). PAGADO CON EXCEDENTE A FAVOR.
    const ped4 = await client.query(`
      INSERT INTO pedido (fecha_generacion, vencimiento, observaciones, precio_total, estado_facturacion, nro_factura, monto_adeudado, estado_pago, id_cliente)
      VALUES (NOW() - INTERVAL '5 days', (NOW() + INTERVAL '15 days')::date, 'Juego completo banquetas', 112800.00, 'no_se_factura', NULL, 0, 'pagado', $1::int)
      RETURNING id_pedido;
    `, [idCli1]);
    const idPed4 = ped4.rows[0].id_pedido;
    await client.query(`INSERT INTO detalle_pedido (id_pedido, id_producto) VALUES ($1::int, $2::int);`, [idPed4, idProd3]);

    // Pedido 5 (María Laura Gomez): Total $397.848 con IVA (6 Sillas Vestidas). PAGO PARCIAL (Debe $197.848).
    const ped5 = await client.query(`
      INSERT INTO pedido (fecha_generacion, vencimiento, observaciones, precio_total, estado_facturacion, nro_factura, monto_adeudado, estado_pago, id_cliente)
      VALUES (NOW() - INTERVAL '8 days', (NOW() + INTERVAL '25 days')::date, 'Juego de sillas comedor principal', 397848.00, 'se_factura', 'A-0001-00008422', 197848.00, 'parcial', $1::int)
      RETURNING id_pedido;
    `, [idCli2]);
    const idPed5 = ped5.rows[0].id_pedido;
    await client.query(`INSERT INTO detalle_pedido (id_pedido, id_producto) VALUES ($1::int, $2::int);`, [idPed5, idProd5]);

    // 9. Facturas de Proveedores (Compras de Insumos)
    console.log("8. Insertando Facturas de Proveedores...");

    // Factura 1 (Maderas del Litoral): $250.000. PAGADA TOTALMENTE.
    const fact1 = await client.query(`
      INSERT INTO factura_proveedor (precio_total, vencimiento, observaciones, fecha_emision, nro_factura_proveedor, monto_adeudado, estado_pago, id_proveedor, tipo_comprobante)
      VALUES (250000.00, (NOW() - INTERVAL '5 days')::date, 'Compra tableros paraíso y petiribí', (NOW() - INTERVAL '20 days')::date, 'FC-0003-00019280', 0, 'pagado', $1::int, 'factura')
      RETURNING id_factura_proveedor;
    `, [idProv1]);
    const idFact1 = fact1.rows[0].id_factura_proveedor;

    // Factura 2 (Textiles Santa Fe): $185.000. PAGO PARCIAL (Debe $85.000). Vence en 4 días.
    const fact2 = await client.query(`
      INSERT INTO factura_proveedor (precio_total, vencimiento, observaciones, fecha_emision, nro_factura_proveedor, monto_adeudado, estado_pago, id_proveedor, tipo_comprobante)
      VALUES (185000.00, (NOW() + INTERVAL '4 days')::date, 'Rollos de lino spazio y pana antimanchas', (NOW() - INTERVAL '8 days')::date, 'FC-0001-00045120', 85000.00, 'parcial', $1::int, 'factura')
      RETURNING id_factura_proveedor;
    `, [idProv2]);
    const idFact2 = fact2.rows[0].id_factura_proveedor;

    // Factura 3 (Lustres del Centro): $74.500. PENDIENTE Y VENCIDA (Debe $74.500).
    const fact3 = await client.query(`
      INSERT INTO factura_proveedor (precio_total, vencimiento, observaciones, fecha_emision, nro_factura_proveedor, monto_adeudado, estado_pago, id_proveedor, tipo_comprobante)
      VALUES (74500.00, (NOW() - INTERVAL '2 days')::date, 'Lacas poliuretánicas y tintes nogal/blanco', (NOW() - INTERVAL '15 days')::date, 'FC-0002-00008910', 74500.00, 'pendiente', $1::int, 'factura')
      RETURNING id_factura_proveedor;
    `, [idProv3]);
    const idFact3 = fact3.rows[0].id_factura_proveedor;

    // Factura 4 (Maderas del Litoral): $120.000. PAGADA CON EXCEDENTE A FAVOR DE LA EMPRESA.
    const fact4 = await client.query(`
      INSERT INTO factura_proveedor (precio_total, vencimiento, observaciones, fecha_emision, nro_factura_proveedor, monto_adeudado, estado_pago, id_proveedor, tipo_comprobante)
      VALUES (120000.00, (NOW() + INTERVAL '20 days')::date, 'Madera de roble seleccionada', (NOW() - INTERVAL '3 days')::date, 'FC-0003-00019340', 0, 'pagado', $1::int, 'factura')
      RETURNING id_factura_proveedor;
    `, [idProv1]);
    const idFact4 = fact4.rows[0].id_factura_proveedor;

    // 10. Pagos de Clientes
    console.log("9. Insertando Pagos de Clientes (con saldos y métodos reales)...");

    // PagoPedido 1: $162.140 por Transferencia -> Imputado a Pedido 1
    const pay1 = await client.query(`
      INSERT INTO pagopedido (fecha_pago, estado_pago, monto, monto_restante, id_medio_pago)
      VALUES ((NOW() - INTERVAL '18 days')::date, 'pagado', 162140.00, 0, 2)
      RETURNING id_pago_pedido;
    `);
    await client.query(`
      INSERT INTO detalle_pago_pedido (monto_usado, id_pedido, id_pago_pedido)
      VALUES (162140.00, $1::int, $2::int);
    `, [idPed1, pay1.rows[0].id_pago_pedido]);

    // PagoPedido 2: $60.000 en Efectivo -> Imputado a Pedido 2
    const pay2 = await client.query(`
      INSERT INTO pagopedido (fecha_pago, estado_pago, monto, monto_restante, id_medio_pago)
      VALUES ((NOW() - INTERVAL '9 days')::date, 'parcial', 60000.00, 0, 1)
      RETURNING id_pago_pedido;
    `);
    await client.query(`
      INSERT INTO detalle_pago_pedido (monto_usado, id_pedido, id_pago_pedido)
      VALUES (60000.00, $1::int, $2::int);
    `, [idPed2, pay2.rows[0].id_pago_pedido]);

    // PagoPedido 3: $130.000 en Cheque -> Imputa $112.800 a Pedido 4, RESTAN $17.200 A FAVOR DE JUAN PÉREZ
    const pay3 = await client.query(`
      INSERT INTO pagopedido (fecha_pago, estado_pago, monto, monto_restante, id_medio_pago)
      VALUES ((NOW() - INTERVAL '4 days')::date, 'pagado', 130000.00, 17200.00, 3)
      RETURNING id_pago_pedido;
    `);
    await client.query(`
      INSERT INTO detalle_pago_pedido (monto_usado, id_pedido, id_pago_pedido)
      VALUES (112800.00, $1::int, $2::int);
    `, [idPed4, pay3.rows[0].id_pago_pedido]);

    // PagoPedido 4: $200.000 con Tarjeta -> Imputado a Pedido 5
    const pay4 = await client.query(`
      INSERT INTO pagopedido (fecha_pago, estado_pago, monto, monto_restante, id_medio_pago)
      VALUES ((NOW() - INTERVAL '6 days')::date, 'parcial', 200000.00, 0, 4)
      RETURNING id_pago_pedido;
    `);
    await client.query(`
      INSERT INTO detalle_pago_pedido (monto_usado, id_pedido, id_pago_pedido)
      VALUES (200000.00, $1::int, $2::int);
    `, [idPed5, pay4.rows[0].id_pago_pedido]);

    // 11. Pagos a Proveedores
    console.log("10. Insertando Pagos a Proveedores (con compras y métodos reales)...");

    // Pago_Insumo 1: $250.000 por Transferencia -> Imputado a Factura 1
    const payProv1 = await client.query(`
      INSERT INTO pago_insumo (fecha_pago, estado_pago, monto, monto_restante, id_medio_pago)
      VALUES ((NOW() - INTERVAL '18 days')::date, 'pagado', 250000.00, 0, 2)
      RETURNING id_pago_insumo;
    `);
    await client.query(`
      INSERT INTO detalle_pago_compra (monto_usado, id_factura_proveedor, id_pago_insumo)
      VALUES (250000.00, $1::int, $2::int);
    `, [idFact1, payProv1.rows[0].id_pago_insumo]);

    // Pago_Insumo 2: $100.000 por Cheque -> Imputado a Factura 2
    const payProv2 = await client.query(`
      INSERT INTO pago_insumo (fecha_pago, estado_pago, monto, monto_restante, id_medio_pago)
      VALUES ((NOW() - INTERVAL '7 days')::date, 'parcial', 100000.00, 0, 3)
      RETURNING id_pago_insumo;
    `);
    await client.query(`
      INSERT INTO detalle_pago_compra (monto_usado, id_factura_proveedor, id_pago_insumo)
      VALUES (100000.00, $1::int, $2::int);
    `, [idFact2, payProv2.rows[0].id_pago_insumo]);

    // Pago_Insumo 3: $145.000 por Transferencia -> Imputa $120.000 a Factura 4, RESTAN $25.000 A FAVOR CON MADERAS DEL LITORAL
    const payProv3 = await client.query(`
      INSERT INTO pago_insumo (fecha_pago, estado_pago, monto, monto_restante, id_medio_pago)
      VALUES ((NOW() - INTERVAL '2 days')::date, 'pagado', 145000.00, 25000.00, 2)
      RETURNING id_pago_insumo;
    `);
    await client.query(`
      INSERT INTO detalle_pago_compra (monto_usado, id_factura_proveedor, id_pago_insumo)
      VALUES (120000.00, $1::int, $2::int);
    `, [idFact4, payProv3.rows[0].id_pago_insumo]);

    // 12. Sincronizar saldos en Cliente y Proveedor
    console.log("11. Sincronizando saldos consolidados...");
    await client.query(`
      UPDATE cliente c
      SET saldo = COALESCE((
        SELECT SUM(p.monto_adeudado)
        FROM pedido p
        WHERE p.id_cliente = c.id_cliente
          AND p.estado_pago <> 'pagado'
      ), 0);
    `);

    await client.query(`
      UPDATE proveedor pr
      SET saldo = COALESCE((
        SELECT SUM(fp.monto_adeudado)
        FROM factura_proveedor fp
        WHERE fp.id_proveedor = pr.id_proveedor
          AND fp.estado_pago <> 'pagado'
      ), 0);
    `);

    await client.query("COMMIT");
    console.log("\n===============================================================");
    console.log("🎉 SISTEMA COMPLETAMENTE SIMULADO, SEMBRADO Y SINCRONIZADO");
    console.log("===============================================================\n");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error al simular y sembrar la base de datos:", err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  resetAndSeed().then(() => pool.end());
}

module.exports = resetAndSeed;
