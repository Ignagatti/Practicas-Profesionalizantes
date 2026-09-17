const pool = require("../config/db");

// Lista de tablas ordenada por dependencias de foreign keys
const ORDEN_TABLAS_PREFERIDO = [
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

/**
 * Genera un dump estructurado en formato SQL con todos los datos del sistema
 */
async function exportarBackup(req, res) {
  const client = await pool.connect();
  try {
    const fecha = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const fechaStr = `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}_${pad(fecha.getHours())}-${pad(fecha.getMinutes())}`;
    const filename = `backup_acuaber_${fechaStr}.sql`;

    // 1. Obtener todas las tablas existentes en el schema public de Neon
    const tablesQuery = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    const existingTableNames = tablesQuery.rows.map(r => r.table_name);

    // Ordenar las tablas según dependencias
    const tablasOrdenadas = [];
    // Primero agregar las conocidas en orden
    for (const t of ORDEN_TABLAS_PREFERIDO) {
      const match = existingTableNames.find(ex => ex.toLowerCase() === t.toLowerCase());
      if (match && !tablasOrdenadas.includes(match)) {
        tablasOrdenadas.push(match);
      }
    }
    // Agregar cualquier otra tabla que exista y no esté en la lista predefinida
    for (const ex of existingTableNames) {
      if (!tablasOrdenadas.includes(ex)) {
        tablasOrdenadas.push(ex);
      }
    }

    let sqlOutput = `-- ========================================================\n`;
    sqlOutput += `-- COPIA DE SEGURIDAD DEL SISTEMA ACUABER\n`;
    sqlOutput += `-- Generado automáticamente: ${fecha.toISOString()}\n`;
    sqlOutput += `-- Base de Datos: Neon Cloud PostgreSQL\n`;
    sqlOutput += `-- ========================================================\n\n`;
    sqlOutput += `BEGIN;\n\n`;

    // 1. Limpieza de datos existentes en orden inverso de dependencias
    sqlOutput += `-- 1. Limpieza de datos existentes\n`;
    for (let i = tablasOrdenadas.length - 1; i >= 0; i--) {
      const tabla = tablasOrdenadas[i];
      sqlOutput += `TRUNCATE TABLE "${tabla}" RESTART IDENTITY CASCADE;\n`;
    }
    sqlOutput += `\n-- 2. Inserción de datos respaldados\n`;

    // 2. Extraer registros de cada tabla
    for (const tabla of tablasOrdenadas) {
      const result = await client.query(`SELECT * FROM "${tabla}"`);
      if (result.rows.length === 0) continue;

      sqlOutput += `\n-- Registros de la tabla: ${tabla}\n`;

      const columns = Object.keys(result.rows[0]);
      const colNames = columns.map(c => `"${c}"`).join(", ");

      for (const row of result.rows) {
        const values = columns.map(col => {
          const val = row[col];
          if (val === null || val === undefined) return "NULL";
          if (typeof val === "boolean") return val ? "true" : "false";
          if (typeof val === "number") return val;
          if (val instanceof Date) return `'${val.toISOString()}'`;
          // Escapar comillas simples
          const escaped = String(val).replace(/'/g, "''");
          return `'${escaped}'`;
        }).join(", ");

        sqlOutput += `INSERT INTO "${tabla}" (${colNames}) VALUES (${values});\n`;
      }
    }

    // 3. Sincronizar secuencias serial de cada tabla
    sqlOutput += `\n-- 3. Sincronización de secuencias serial\n`;
    for (const tabla of tablasOrdenadas) {
      sqlOutput += `DO $$ 
      DECLARE
        col_name text;
        seq_name text;
      BEGIN
        SELECT column_name INTO col_name
        FROM information_schema.columns 
        WHERE table_name='${tabla}' AND column_default LIKE 'nextval%'
        LIMIT 1;

        IF col_name IS NOT NULL THEN
          seq_name := pg_get_serial_sequence('"${tabla}"', col_name);
          IF seq_name IS NOT NULL THEN
            EXECUTE 'SELECT setval(''' || seq_name || ''', coalesce((SELECT max("' || col_name || '") FROM "${tabla}"), 1), true)';
          END IF;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END $$;\n`;
    }

    sqlOutput += `\nCOMMIT;\n`;
    sqlOutput += `-- ========================================================\n`;
    sqlOutput += `-- FIN DEL RESPALDO\n`;
    sqlOutput += `-- ========================================================\n`;

    res.setHeader("Content-Type", "application/sql; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(sqlOutput);
  } catch (error) {
    console.error("Error al exportar copia de seguridad:", error);
    return res.status(500).json({
      ok: false,
      error: "No se pudo generar la copia de seguridad: " + error.message
    });
  } finally {
    client.release();
  }
}

/**
 * Restaura la base de datos a partir de un script SQL enviado
 */
async function restaurarBackup(req, res) {
  const { sqlContent } = req.body;

  if (!sqlContent || typeof sqlContent !== "string" || sqlContent.trim().length === 0) {
    return res.status(400).json({
      ok: false,
      error: "No se proporcionó el contenido del archivo SQL de respaldo."
    });
  }

  // Validación de seguridad básica del script
  if (!sqlContent.includes("BEGIN;") && !sqlContent.includes("INSERT INTO") && !sqlContent.includes("TRUNCATE TABLE")) {
    return res.status(400).json({
      ok: false,
      error: "El archivo no parece ser un archivo de respaldo SQL válido de Acuaber."
    });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN;");
    await client.query(sqlContent);
    await client.query("COMMIT;");

    return res.status(200).json({
      ok: true,
      mensaje: "La base de datos fue restaurada exitosamente."
    });
  } catch (error) {
    await client.query("ROLLBACK;");
    console.error("Error al restaurar copia de seguridad:", error);
    return res.status(500).json({
      ok: false,
      error: "Error al restaurar el respaldo. La operación fue cancelada para proteger los datos: " + error.message
    });
  } finally {
    client.release();
  }
}

module.exports = {
  exportarBackup,
  restaurarBackup
};
