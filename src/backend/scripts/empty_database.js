require("dotenv").config();
const pool = require("../config/db");

async function emptyDatabase() {
  const client = await pool.connect();
  try {
    console.log("=================================================");
    console.log("🧹 VACIANDO BASE DE DATOS COMPLETA");
    console.log("=================================================\n");

    await client.query("BEGIN");

    // 1. Obtener todas las tablas
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
      console.log(`✅ Tablas vaciadas: ${tablesRes.rows.map(r => r.table_name).join(", ")}`);
    }

    // 2. Insertar Métodos de Pago base
    console.log("▶ Reinsertando Métodos de Pago predefinidos...");
    await client.query(`
      INSERT INTO metodo_pago (id_medio_pago, tipo) VALUES 
        (1, 'efectivo'),
        (2, 'transferencia'),
        (3, 'cheque'),
        (4, 'tarjeta')
      ON CONFLICT (id_medio_pago) DO NOTHING;
    `);

    // 3. Insertar Licencia activa predefinida
    console.log("▶ Reinsertando Licencia activa de sistema...");
    await client.query(`
      INSERT INTO licencia (clave, titular, activa) VALUES 
        ('ACUABER-FABRICA-2026', 'Acuaber Fábrica Central', true)
      ON CONFLICT (clave) DO NOTHING;
    `);

    await client.query("COMMIT");
    console.log("\n🎉 BASE DE DATOS VACIADA Y LISTA PARA SU USO DESDE CERO (0 REGISTROS).");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error al vaciar la base de datos:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

emptyDatabase();
