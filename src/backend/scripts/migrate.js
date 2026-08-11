const pool = require('../config/db');
async function alterTable() {
  try {
    await pool.query(`ALTER TABLE Factura_Proveedor ADD COLUMN IF NOT EXISTS tipo_comprobante VARCHAR(20) DEFAULT 'factura';`);
    await pool.query(`ALTER TABLE Factura_Proveedor ADD COLUMN IF NOT EXISTS archivo_pdf VARCHAR(255);`);
    console.log('Tabla Factura_Proveedor alterada correctamente.');
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
alterTable();
