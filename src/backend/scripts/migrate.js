const pool = require('../config/db');

async function migrate() {
  try {
    await pool.query(`ALTER TABLE Factura_Proveedor ADD COLUMN IF NOT EXISTS tipo_comprobante VARCHAR(20) DEFAULT 'factura';`);
    await pool.query(`ALTER TABLE Factura_Proveedor ADD COLUMN IF NOT EXISTS archivo_pdf VARCHAR(255);`);

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
  } catch (e) {
    console.error('Error en migración:', e);
  }
}

if (require.main === module) {
  migrate().then(() => pool.end());
}

module.exports = migrate;
