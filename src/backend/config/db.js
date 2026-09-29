const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de entorno desde multiples ubicaciones posibles (local y empaquetado)
dotenv.config();
dotenv.config({ path: path.join(__dirname, '../../../.env') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("❌ ERROR CRÍTICO: No se encontró la variable DATABASE_URL en el archivo .env.");
    process.exit(1);
}

const isLocalDb = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

const sslOption = isLocalDb
    ? false
    : { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true' || process.env.NODE_ENV === 'production' };

const pool = new Pool({
    connectionString: connectionString,
    ssl: sslOption
});

module.exports = pool;