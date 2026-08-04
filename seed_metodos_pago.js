require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function seed() {
  try {
    try {
      await pool.query(`ALTER TYPE tipo_pago ADD VALUE 'tarjeta';`);
    } catch (e) {
    }
    
    const tipos = ['efectivo', 'transferencia', 'cheque', 'tarjeta'];
    for(let tipo of tipos) {
        try {
            const res = await pool.query(`SELECT 1 FROM metodo_pago WHERE tipo = $1`, [tipo]);
            if (res.rows.length === 0) {
                await pool.query(`INSERT INTO metodo_pago (tipo) VALUES ($1)`, [tipo]);
            }
        } catch(e) {
            console.log("Error insertado:", tipo, e.message);
        }
    }

    const res2 = await pool.query('SELECT * FROM metodo_pago');
    console.log("Resultados finales:", res2.rows);

  } catch (error) {
     console.error(error);
  } finally {
    await pool.end();
  }
}

seed();
