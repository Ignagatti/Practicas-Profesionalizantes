const pool = require("../config/db");
const { exportarBackup, restaurarBackup } = require("../controllers/backupController");

async function runBackupTests() {
  console.log("=================================================");
  console.log("🛠️ INICIANDO SUITE DE TESTING DE BACKUP Y RESTORE");
  console.log("=================================================\n");

  const client = await pool.connect();

  try {
    // 1. Contar registros iniciales en las tablas principales
    console.log("📊 1. Consultando estado y conteos iniciales de Neon...");
    const tablas = [
      "licencia", "metodo_pago", "cliente", "proveedor",
      "producto", "insumo", "pedido", "factura_proveedor"
    ];

    const conteosIniciales = {};
    for (const t of tablas) {
      try {
        const res = await client.query(`SELECT COUNT(*) FROM "${t}"`);
        conteosIniciales[t] = parseInt(res.rows[0].count, 10);
        console.log(`   - ${t}: ${conteosIniciales[t]} registros`);
      } catch (e) {
        console.log(`   - ${t}: [No encontrada o vacía - ${e.message}]`);
      }
    }

    // 2. Simular Exportación de Backup
    console.log("\n📦 2. Ejecutando exportación de Backup...");
    let capturedSQL = "";
    let capturedHeaders = {};
    let statusSent = 200;

    const mockReq = {};
    const mockRes = {
      setHeader: (key, val) => { capturedHeaders[key] = val; },
      status: (code) => {
        statusSent = code;
        return {
          send: (body) => { capturedSQL = body; return mockRes; },
          json: (body) => { console.error("Error JSON:", body); return mockRes; }
        };
      },
      send: (body) => { capturedSQL = body; return mockRes; }
    };

    await exportarBackup(mockReq, mockRes);

    if (!capturedSQL || statusSent !== 200) {
      throw new Error("La exportación falló o no generó contenido SQL.");
    }

    console.log(`   ✅ Backup generado exitosamente.`);
    console.log(`   - Tamaño del script SQL: ${(Buffer.byteLength(capturedSQL) / 1024).toFixed(2)} KB`);
    console.log(`   - Header Content-Disposition: ${capturedHeaders["Content-Disposition"]}`);

    // Verificar que el script contenga las estructuras esperadas
    if (!capturedSQL.includes("BEGIN;") || !capturedSQL.includes("COMMIT;")) {
      throw new Error("El script SQL no cuenta con delimitadores transaccionales seguros (BEGIN / COMMIT).");
    }
    if (!capturedSQL.includes("INSERT INTO") && Object.values(conteosIniciales).some(v => v > 0)) {
      throw new Error("El script no contiene las sentencias INSERT correspondientes.");
    }
    console.log("   ✅ Sintaxis transaccional y sentencias INSERT validadas.");

    // 3. Probar Restauración
    console.log("\n🔄 3. Ejecutando restauración a partir del script generado...");
    let restoreStatus = 200;
    let restoreResponse = null;

    const mockRestoreReq = { body: { sqlContent: capturedSQL } };
    const mockRestoreRes = {
      status: (code) => {
        restoreStatus = code;
        return {
          json: (body) => { restoreResponse = body; return mockRestoreRes; }
        };
      },
      json: (body) => { restoreResponse = body; return mockRestoreRes; }
    };

    await restaurarBackup(mockRestoreReq, mockRestoreRes);

    if (restoreStatus !== 200 || !restoreResponse?.ok) {
      throw new Error(`La restauración falló: ${JSON.stringify(restoreResponse)}`);
    }
    console.log("   ✅ Script restaurado y ejecutado exitosamente en Neon.");

    // 4. Verificar integridad post-restauración
    console.log("\n🔍 4. Verificando conteos e integridad de datos post-restauración...");
    let coincidenTodos = true;
    for (const t of tablas) {
      try {
        const res = await client.query(`SELECT COUNT(*) FROM "${t}"`);
        const conteoActual = parseInt(res.rows[0].count, 10);
        const original = conteosIniciales[t];
        const coincide = conteoActual === original;
        if (!coincide) coincidenTodos = false;
        console.log(`   - ${t}: ${conteoActual} registros (Original: ${original}) -> ${coincide ? "✅ CORRECTO" : "❌ DISCREPANCIA"}`);
      } catch (e) {
        console.log(`   - ${t}: Error verificando - ${e.message}`);
      }
    }

    if (!coincidenTodos) {
      throw new Error("Hubo discrepancias en los conteos de registros tras la restauración.");
    }

    // 5. Probar manejo de errores de restauración (seguridad y rollback)
    console.log("\n🛡️ 5. Probando resiliencia y ROLLBACK ante script corrupto...");
    const corruptSQL = `BEGIN; INSERT INTO "Tabla_Inexistente_XYZ" VALUES (1); COMMIT;`;
    let corruptStatus = 200;
    let corruptResponse = null;

    const mockCorruptRes = {
      status: (code) => {
        corruptStatus = code;
        return {
          json: (body) => { corruptResponse = body; return mockCorruptRes; }
        };
      },
      json: (body) => { corruptResponse = body; return mockCorruptRes; }
    };

    await restaurarBackup({ body: { sqlContent: corruptSQL } }, mockCorruptRes);
    if (corruptStatus === 500 && !corruptResponse?.ok) {
      console.log("   ✅ El rollback funcionó correctamente. La base de datos rechazó el script erróneo sin corromperse.");
    } else {
      throw new Error("El sistema no manejó correctamente el script corrupto.");
    }

    console.log("\n=================================================");
    console.log("🎉 TODOS LOS TESTS DE BACKUP Y RESTORE PASARON AL 100%");
    console.log("=================================================\n");

  } catch (err) {
    console.error("\n❌ ERROR EN EL TEST:", err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

runBackupTests();
