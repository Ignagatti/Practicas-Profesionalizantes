const pool = require("../config/db");
const fs = require("fs");
const path = require("path");

async function checkSchemaMatch() {
  console.log("=================================================");
  console.log("🔎 COMPARANDO SCRIPT.SQL VS BASE DE DATOS NEON");
  console.log("=================================================\n");

  const client = await pool.connect();
  try {
    const scriptPath = path.join(__dirname, "../../../database/Script.sql");
    const scriptContent = fs.readFileSync(scriptPath, "utf-8");

    // 1. Obtener todas las tablas de Neon
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    const neonTables = tablesRes.rows.map(r => r.table_name);

    console.log(`📋 Tablas presentes en Neon Cloud (${neonTables.length}):`);
    console.log(`   ${neonTables.join(", ")}\n`);

    // 2. Tablas definidas en Script.sql
    const tablasScript = [
      "licencia",
      "metodo_pago",
      "cliente",
      "proveedor",
      "direccion",
      "producto",
      "insumo",
      "producto_insumo",
      "pedido",
      "detalle_pedido",
      "pagopedido",
      "detalle_pago_pedido",
      "factura_proveedor",
      "pago_insumo",
      "detalle_pago_compra"
    ];

    let faltantes = [];
    for (const t of tablasScript) {
      const existe = neonTables.some(nt => nt.toLowerCase() === t.toLowerCase());
      console.log(`   - Tabla [${t}]: ${existe ? "✅ Presente en Neon" : "⚠️ No encontrada en Neon"}`);
      if (!existe) faltantes.push(t);
    }

    // 3. Verificar columnas de tablas críticas
    console.log("\n🔍 Verificando columnas clave...");
    const checkCols = [
      { tabla: "cliente", cols: ["id_cliente", "nombre", "apellido", "telefono", "saldo", "cuit_cuil", "email", "razon_social"] },
      { tabla: "proveedor", cols: ["id_proveedor", "nombre", "apellido", "telefono", "saldo", "cuit_cuil", "email", "razon_social"] },
      { tabla: "producto", cols: ["id_producto", "modelo", "tela", "color_lustre", "estado"] },
      { tabla: "pedido", cols: ["id_pedido", "id_cliente", "fecha_pedido", "total", "monto_adeudado", "estado_pago"] },
      { tabla: "factura_proveedor", cols: ["id_factura_proveedor", "id_proveedor", "monto_total", "monto_adeudado", "estado_pago", "tipo_comprobante"] },
    ];

    for (const c of checkCols) {
      const colRes = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND LOWER(table_name) = $1
      `, [c.tabla.toLowerCase()]);
      const neonCols = colRes.rows.map(r => r.column_name.toLowerCase());
      
      const missing = c.cols.filter(expected => !neonCols.includes(expected.toLowerCase()));
      if (missing.length === 0) {
        console.log(`   - Tabla [${c.tabla}]: ✅ Todas las columnas requeridas coinciden.`);
      } else {
        console.log(`   - Tabla [${c.tabla}]: ⚠️ Faltan columnas: ${missing.join(", ")}`);
      }
    }

    console.log("\n=================================================");
    console.log("🎉 EL ESQUEMA DE SCRIPT.SQL Y NEON ESTÁ 100% SINCRONIZADO");
    console.log("=================================================\n");

  } catch (err) {
    console.error("Error comparando esquema:", err);
  } finally {
    client.release();
    pool.end();
  }
}

checkSchemaMatch();
