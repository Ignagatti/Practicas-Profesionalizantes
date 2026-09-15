const pool = require('../config/db');

async function migrate() {
  try {
    // Columnas adicionales para Factura_Proveedor
    await pool.query(`ALTER TABLE Factura_Proveedor ADD COLUMN IF NOT EXISTS tipo_comprobante VARCHAR(20) DEFAULT 'factura';`);
    await pool.query(`ALTER TABLE Factura_Proveedor ADD COLUMN IF NOT EXISTS archivo_pdf VARCHAR(255);`);

    // Columnas para Soft Delete (Baja lógica y preservación histórica)
    await pool.query(`ALTER TABLE Insumo ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;`);
    await pool.query(`ALTER TABLE Insumo ADD COLUMN IF NOT EXISTS eliminado_en TIMESTAMP WITH TIME ZONE;`);

    await pool.query(`ALTER TABLE Producto ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;`);
    await pool.query(`ALTER TABLE Producto ADD COLUMN IF NOT EXISTS eliminado_en TIMESTAMP WITH TIME ZONE;`);

    await pool.query(`ALTER TABLE Cliente ADD COLUMN IF NOT EXISTS eliminado_en TIMESTAMP WITH TIME ZONE;`);
    await pool.query(`ALTER TABLE Proveedor ADD COLUMN IF NOT EXISTS eliminado_en TIMESTAMP WITH TIME ZONE;`);

    try {
      await pool.query(`ALTER TYPE tipo_pago ADD VALUE IF NOT EXISTS 'tarjeta';`);
    } catch (errEnum) {
      // Ignorar error si el enum ya contiene tarjeta
    }

    const checkMetodos = await pool.query(`SELECT COUNT(*) FROM Metodo_Pago;`);
    if (parseInt(checkMetodos.rows[0].count, 10) === 0) {
      await pool.query(`
        INSERT INTO Metodo_Pago (Id_Medio_Pago, Tipo) VALUES 
          (1, 'efectivo'),
          (2, 'transferencia'),
          (3, 'cheque')
        ON CONFLICT (Id_Medio_Pago) DO NOTHING;
      `);
      try {
        await pool.query(`INSERT INTO Metodo_Pago (Id_Medio_Pago, Tipo) VALUES (4, 'tarjeta') ON CONFLICT (Id_Medio_Pago) DO NOTHING;`);
      } catch (errTarjeta) {
        // Ignorar error si ya existe
      }
      console.log('Se inicializó la tabla Metodo_Pago con los métodos predeterminados.');
    }

    // Tabla de Licencias del Sistema
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Licencia (
        id SERIAL PRIMARY KEY,
        clave VARCHAR(100) UNIQUE NOT NULL,
        titular VARCHAR(100) DEFAULT 'Acuaber Fábrica',
        activa BOOLEAN DEFAULT true,
        creada_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    const checkLicencia = await pool.query(`SELECT COUNT(*) FROM Licencia;`);
    if (parseInt(checkLicencia.rows[0].count, 10) === 0) {
      await pool.query(`
        INSERT INTO Licencia (clave, titular, activa) 
        VALUES ('ACUABER-FABRICA-2026', 'Acuaber Fábrica Central', true)
        ON CONFLICT (clave) DO NOTHING;
      `);
      console.log('Se inicializó la tabla Licencia con la clave predeterminada.');
    }
  } catch (e) {
    console.error('Error en migración:', e);
  }
}

if (require.main === module) {
  migrate().then(() => pool.end());
}

module.exports = migrate;
